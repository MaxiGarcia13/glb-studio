import type { Mesh, Object3D } from 'three';
import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';

import { getPartKind } from './part-kind';
import { nextPartName } from './part-name';

/** Local-space X offset (metres) so each new part is not stacked on the previous. */
export const PART_SPAWN_OFFSET = 0.25;

/**
 * Spawn a stamped create part into a scene: unique name, ground-origin geometry,
 * bottom on y = 0. Later siblings are nudged on +X so they are not glued together.
 */
export function spawnPart(
  scene: Object3D,
  kindId: PartKindId,
  params?: PartSizeParams,
): Mesh {
  const kind = getPartKind(kindId);
  const mesh = kind.createMesh(
    (params ?? { ...kind.defaultParams }) as PartSizeParams,
  );
  mesh.name = nextPartName(scene, kindId);
  mesh.position.x = scene.children.length * PART_SPAWN_OFFSET;
  scene.add(mesh);
  return mesh;
}
