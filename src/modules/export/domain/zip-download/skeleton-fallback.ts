import type { ModelEntry } from '@/modules/viewport/types/model';

import { Group } from 'three';

import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';

/** Prefer a skinned rig; created scenes have no skeleton for animation-only packs. */
export function resolveSkeletonFallback(
  models: readonly ModelEntry[],
  active: ModelEntry | null,
): Group {
  const preferred
    = (active && isSkinnedLibraryModel(active) ? active : null)
      ?? models.find((model) => isSkinnedLibraryModel(model))
      ?? active
      ?? models[0]
      ?? null;

  return preferred?.scene ?? new Group();
}
