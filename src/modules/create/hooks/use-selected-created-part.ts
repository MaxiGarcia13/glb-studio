import type { Mesh, MeshStandardMaterial } from 'three';

import type { CreatePartUserData } from '../domain/part-data';
import type { PartKind } from '../domain/part-kind';
import { useStore } from '@nanostores/react';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { readCreatePart } from '../domain/part-data';
import { getPartKind } from '../domain/part-kind';
import {
  asMesh,
  findMeshStandardMaterial,
  isInActiveModelScene,
} from '../utils/selected-part';

export function useIsCreatedModelFocused(): boolean {
  const activeModel = useStore($activeModel);
  return activeModel?.source === 'created';
}

function useSelectedCreatedMesh(): Mesh | null {
  const activeModel = useStore($activeModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });

  if (activeModel?.source !== 'created' || !selected) {
    return null;
  }

  const mesh = asMesh(selected);
  if (!mesh || !isInActiveModelScene(mesh, activeModel.scene)) {
    return null;
  }

  return mesh;
}

/** Selected mesh material when it belongs to the focused created model. */
export function useSelectedCreatedPartMaterial(): MeshStandardMaterial | null {
  return findMeshStandardMaterial(useSelectedCreatedMesh());
}

export interface SelectedCreatedPart {
  mesh: Mesh;
  kind: PartKind;
  record: CreatePartUserData;
}

/** Selected stamped create part on the focused created model. */
export function useSelectedCreatedPart(): SelectedCreatedPart | null {
  const mesh = useSelectedCreatedMesh();
  if (!mesh) {
    return null;
  }

  const record = readCreatePart(mesh);
  if (!record) {
    return null;
  }

  return {
    mesh,
    kind: getPartKind(record.kind),
    record,
  };
}
