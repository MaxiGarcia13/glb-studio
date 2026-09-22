import type { Mesh, MeshStandardMaterial } from 'three';

import type { SelectedCreatedPart } from '../domain/resolve-selected-created-part';
import { useStore } from '@nanostores/react';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  canOpenTexturePrep,
  resolveSelectedCreatedPart,
} from '../domain/resolve-selected-created-part';
import {
  findMeshStandardMaterial,
} from '../utils/selected-part';

export type { SelectedCreatedPart };

export function useIsCreatedModelFocused(): boolean {
  const activeModel = useStore($activeModel);
  return activeModel?.source === 'created';
}

function useSelectedCreatedMesh(): Mesh | null {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  return resolveSelectedCreatedPart(activeModel, selected)?.mesh ?? null;
}

/** Selected mesh material when it belongs to the focused created model. */
export function useSelectedCreatedPartMaterial(): MeshStandardMaterial | null {
  return findMeshStandardMaterial(useSelectedCreatedMesh());
}

/** Selected stamped create part on the focused created model. */
export function useSelectedCreatedPart(): SelectedCreatedPart | null {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  return resolveSelectedCreatedPart(activeModel, selected);
}

/** Whether Texture prep may open for the current focus / selection. */
export function useCanOpenTexturePrep(): boolean {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  return canOpenTexturePrep(activeModel, selected);
}
