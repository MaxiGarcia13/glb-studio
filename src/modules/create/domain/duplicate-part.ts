import type { Mesh, MeshStandardMaterial, Object3D } from 'three';

import { readCreatePart } from './part-data';
import { getPartKind } from './part-kind';
import { nextPartName } from './part-name';

/** Local-space offset (metres) so the clone is visible beside the source. */
export const DUPLICATE_PART_OFFSET = 0.25;

/**
 * Clone a stamped create part: fresh geometry + material, copied TRS / color,
 * unique name, parented next to the source with a slight X offset.
 * Returns null when the mesh is not a stamped create part.
 */
export function duplicatePart(source: Mesh, sceneRoot: Object3D): Mesh | null {
  const record = readCreatePart(source);
  if (!record) {
    return null;
  }

  const kind = getPartKind(record.kind);
  const clone = kind.createMesh({ ...record.params });

  clone.position.copy(source.position);
  clone.position.x += DUPLICATE_PART_OFFSET;
  clone.quaternion.copy(source.quaternion);
  clone.scale.copy(source.scale);
  clone.name = nextPartName(sceneRoot, record.kind);

  const sourceMaterial = source.material as MeshStandardMaterial | MeshStandardMaterial[];
  const cloneMaterial = clone.material as MeshStandardMaterial;
  if (
    !Array.isArray(sourceMaterial) &&
    sourceMaterial &&
    'isMeshStandardMaterial' in sourceMaterial &&
    cloneMaterial &&
    'isMeshStandardMaterial' in cloneMaterial
  ) {
    cloneMaterial.color.copy(sourceMaterial.color);
  }

  const parent = source.parent ?? sceneRoot;
  parent.add(clone);
  return clone;
}
