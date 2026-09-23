import type { SkinnedTextureAvailability } from '../domain/color-map/resolve-skinned-texture-target';

import { useStore } from '@nanostores/react';
import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { getSkinnedTextureAvailability } from '../domain/color-map/resolve-skinned-texture-target';

export function useIsSkinnedLibraryModelFocused(): boolean {
  const activeModel = useStore($activeModel);
  return activeModel ? isSkinnedLibraryModel(activeModel) : false;
}

/** Availability + target for skinned albedo apply / clear (US-40). */
export function useSkinnedTextureAvailability(): SkinnedTextureAvailability {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  return getSkinnedTextureAvailability(activeModel, selected);
}
