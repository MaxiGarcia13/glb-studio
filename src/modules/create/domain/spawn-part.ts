import type { Mesh, Object3D } from 'three';
import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';

import { getPartKind } from './part-kind';
import { nextPartName } from './part-name';

/**
 * Spawn a stamped create part into a scene: unique name, ground-origin geometry,
 * identity TRS (bottom on y = 0).
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
  scene.add(mesh);
  return mesh;
}
