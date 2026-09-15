import type { AnimationClip } from 'three';

import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { bakeTimeScale } from '@/modules/animation/domain/clip-bake';
import {
  buildSkeletonNodeSet,
  validateClipAgainstSkeleton,
} from '@/modules/animation/domain/clip-validate';
import { exportGlbBinary } from '../adapters/gltf-exporter';
import { stripGlbExtension } from '../utils/file-name';

export interface ModelGlbResult {
  arrayBuffer: ArrayBuffer;
  fileName: string;
}

/** Collect clips that belong in an imported model GLB (owned + matching shared). */
function collectImportedModelAnimations(
  model: ModelEntry,
  clips: ClipEntry[],
): AnimationClip[] {
  const nodeNames = buildSkeletonNodeSet(model.scene);
  const animations: AnimationClip[] = [];

  for (const entry of clips) {
    if (!entry.clip) {
      continue;
    }
    // Other models' owned clips never pack into this GLB.
    if (entry.ownerModelId !== null && entry.ownerModelId !== model.id) {
      continue;
    }
    // Owned clips for this model: already validated at sync time, include if ready.
    if (entry.ownerModelId === model.id) {
      if (entry.status === 'ready') {
        animations.push(bakeTimeScale(entry.clip, entry.timeScale));
      }
      continue;
    }
    // Shared clips: validate against this model, skip conflicted.
    if (validateClipAgainstSkeleton(entry.clip, nodeNames).valid) {
      animations.push(bakeTimeScale(entry.clip, entry.timeScale));
    }
  }

  return animations;
}

/**
 * Serialize a library model scene as `{fileName}.glb`.
 * Created models pack the mesh scene only (no skeleton / animation tracks).
 */
export async function packModelGlb(
  model: ModelEntry,
  clips: ClipEntry[],
): Promise<ModelGlbResult> {
  const animations
    = model.source === 'created'
      ? []
      : collectImportedModelAnimations(model, clips);

  const arrayBuffer = await exportGlbBinary(model.scene, animations);
  return { arrayBuffer, fileName: `${stripGlbExtension(model.fileName)}.glb` };
}
