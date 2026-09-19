import type { PartKind, PartKindId } from '@/modules/create/types/part';

import {
  circleKind,
  planeKind,
  polygonKind,
  ringKind,
  triangleKind,
} from './planar';
import {
  dodecahedronKind,
  icosahedronKind,
  octahedronKind,
  tetrahedronKind,
} from './polyhedra';
import {
  boxKind,
  capsuleKind,
  coneKind,
  cylinderKind,
  sphereKind,
  torusKind,
} from './solids';

/** Registry of all create-part primitive kinds. */
export const PART_KINDS: { [K in PartKindId]: PartKind<K> } = {
  box: boxKind,
  sphere: sphereKind,
  cylinder: cylinderKind,
  capsule: capsuleKind,
  plane: planeKind,
  cone: coneKind,
  torus: torusKind,
  triangle: triangleKind,
  polygon: polygonKind,
  circle: circleKind,
  ring: ringKind,
  tetrahedron: tetrahedronKind,
  octahedron: octahedronKind,
  icosahedron: icosahedronKind,
  dodecahedron: dodecahedronKind,
};
