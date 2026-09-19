import type { ModelEntry } from '@/modules/viewport/types/model';

import { Group } from 'three';

/** Prefer an imported rig; created scenes have no skeleton for animation-only packs. */
export function resolveSkeletonFallback(
  models: readonly ModelEntry[],
  active: ModelEntry | null,
): Group {
  const preferred
    = (active?.source === 'imported' ? active : null)
      ?? models.find((model) => model.source === 'imported')
      ?? active
      ?? models[0]
      ?? null;

  return preferred?.scene ?? new Group();
}
