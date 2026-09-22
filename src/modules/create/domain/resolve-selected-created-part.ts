import type { Mesh, Object3D } from 'three';
import type { CreatePartUserData } from './part-data';
import type { PartKind } from './part-kind';
import type { ModelEntry } from '@/modules/viewport/types/model';
import {
  asMesh,
  isInActiveModelScene,
} from '../utils/selected-part';
import { readCreatePart } from './part-data';
import { getPartKind } from './part-kind';

export interface SelectedCreatedPart {
  mesh: Mesh;
  kind: PartKind;
  record: CreatePartUserData;
}

/**
 * Resolve a stamped create part on the focused created model.
 * Returns null for imported focus, missing selection, or unstamped meshes
 * so texture prep never opens outside the created-part gate (US-39).
 */
export function resolveSelectedCreatedPart(
  activeModel: ModelEntry | null | undefined,
  selected: Object3D | null | undefined,
): SelectedCreatedPart | null {
  if (!activeModel || activeModel.source !== 'created' || !selected) {
    return null;
  }

  const mesh = asMesh(selected);
  if (!mesh || !isInActiveModelScene(mesh, activeModel.scene)) {
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

/** True when texture prep may open for the current focus / selection. */
export function canOpenTexturePrep(
  activeModel: ModelEntry | null | undefined,
  selected: Object3D | null | undefined,
): boolean {
  return resolveSelectedCreatedPart(activeModel, selected) !== null;
}
