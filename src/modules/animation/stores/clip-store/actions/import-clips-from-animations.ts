import type { AnimationClip, Object3D } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { captureBindLengths } from '@/modules/animation/domain/bone-registry';
import { buildSkeletonNodeSet, validateClipAgainstSkeleton } from '@/modules/animation/domain/clip-validate';
import { $clips } from '../store';
import { nextClipId, toEntry } from '../utils';

/**
 * Register already-parsed clips under a model (e.g. embedded GLB animations).
 * Skips clips whose name is already owned by that model.
 * Does not auto-select — model load/select leaves T-pose until the user picks a clip.
 */
export function importClipsFromAnimations(
  animations: AnimationClip[],
  skeleton: Object3D,
  sourceFile: string,
  ownerModelId: string,
): void {
  if (animations.length === 0) {
    return;
  }

  const nodeNames = buildSkeletonNodeSet(skeleton);
  const sourceBindLengths = captureBindLengths(skeleton);
  const sourceBindFrames = captureBindFrames(skeleton);
  const ownedNames = new Set(
    $clips
      .get()
      .clips
      .filter((entry) => entry.ownerModelId === ownerModelId)
      .map((entry) => entry.name),
  );

  const entries: ClipEntry[] = [];
  const baseId = nextClipId();

  for (const clip of animations) {
    if (ownedNames.has(clip.name)) {
      continue;
    }
    const validation = validateClipAgainstSkeleton(clip, nodeNames);
    entries.push(toEntry(
      validation,
      baseId,
      clip,
      sourceFile,
      sourceBindLengths,
      sourceBindFrames,
      ownerModelId,
    ));
  }

  if (entries.length === 0) {
    return;
  }

  $clips.setKey('clips', [...$clips.get().clips, ...entries]);
}
