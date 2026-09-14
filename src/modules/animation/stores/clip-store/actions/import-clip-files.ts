import type { Object3D } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import { loadClipsFromFile } from '@/modules/animation/adapters/clip-loader';
import { buildSkeletonNodeSet, validateClipAgainstSkeleton } from '@/modules/animation/domain/clip-validate';
import { $clips } from '../store';
import { applyActiveModelBindOverrides, nextClipId, toEntry, toFailedFileEntry } from '../utils';
import { selectClip } from './select-clip';

export async function importClipFiles(
  files: File[],
  skeleton: Object3D | null,
  ownerModelId: string | null = null,
): Promise<void> {
  // Owned imports need a skeleton to validate against. Shared imports do not —
  // mismatch is contextual per model in the library UI.
  if (ownerModelId !== null && !skeleton) {
    return;
  }

  const nodeNames = skeleton ? buildSkeletonNodeSet(skeleton) : null;

  const entries: ClipEntry[] = [];

  for (const file of files) {
    const baseId = nextClipId();
    try {
      const result = await loadClipsFromFile(file);
      for (const clip of result.clips) {
        const validation
          = ownerModelId !== null && nodeNames
            ? validateClipAgainstSkeleton(clip, nodeNames)
            : { valid: true, error: null };
        entries.push(applyActiveModelBindOverrides(toEntry(
          validation,
          baseId,
          clip,
          result.name,
          result.sourceBindLengths,
          result.sourceBindFrames,
          ownerModelId,
        )));
      }
    } catch (error) {
      entries.push(toFailedFileEntry(baseId, file.name, error, ownerModelId));
    }
  }

  if (entries.length === 0) {
    return;
  }

  $clips.setKey('clips', [...$clips.get().clips, ...entries]);

  const state = $clips.get();
  if (!state.activeClipId) {
    const firstReady = entries.find((entry) => entry.status === 'ready');
    if (firstReady) {
      selectClip(firstReady.id);
    }
  }
}
