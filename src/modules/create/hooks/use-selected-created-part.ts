import type { MeshStandardMaterial } from 'three';

import { useStore } from '@nanostores/react';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  findMeshStandardMaterial,
  isInActiveModelScene,
} from '../utils/selected-part';

export function useIsCreatedModelFocused(): boolean {
  const activeModel = useStore($activeModel);
  return activeModel?.source === 'created';
}

/** Selected mesh material when it belongs to the focused created model. */
export function useSelectedCreatedPartMaterial(): MeshStandardMaterial | null {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });

  if (activeModel?.source !== 'created' || !selected) {
    return null;
  }

  const material = findMeshStandardMaterial(selected);
  if (!material) {
    return null;
  }

  const scene = activeModel.scene ?? null;
  if (!isInActiveModelScene(selected, scene)) {
    return null;
  }

  return material;
}
