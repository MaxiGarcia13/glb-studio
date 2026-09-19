import type { BufferGeometry } from 'three';
import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';

import { CircleGeometry, Mesh, MeshStandardMaterial } from 'three';
import { writeCreatePart } from '@/modules/create/domain/part-data';

/** Stamp a create-part mesh with kind + size params. */
export function partMesh<K extends PartKindId>(
  kind: K,
  geometry: BufferGeometry,
  params: PartSizeParams<K>,
): Mesh {
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = kind;
  writeCreatePart(mesh, { kind, params: { ...params } });
  return mesh;
}

export function regularPolygonGeometry(radius: number, sides: number): BufferGeometry {
  const segments = Math.max(3, Math.round(sides));
  return new CircleGeometry(radius, segments);
}
