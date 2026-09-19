import type { PartKind } from '@/modules/create/types/part';

import {
  DodecahedronGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  TetrahedronGeometry,
} from 'three';
import { withGroundOrigin } from '@/modules/create/domain/geometry-ground';
import { partMesh } from './create-part-mesh';
import { DEFAULT_PART_SIZE as S } from './default-size';

export const tetrahedronKind: PartKind<'tetrahedron'> = {
  id: 'tetrahedron',
  label: 'Tetrahedron',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new TetrahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('tetrahedron', tetrahedronKind.createGeometry(params), params),
};

export const octahedronKind: PartKind<'octahedron'> = {
  id: 'octahedron',
  label: 'Octahedron',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new OctahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('octahedron', octahedronKind.createGeometry(params), params),
};

export const icosahedronKind: PartKind<'icosahedron'> = {
  id: 'icosahedron',
  label: 'Icosahedron',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new IcosahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('icosahedron', icosahedronKind.createGeometry(params), params),
};

export const dodecahedronKind: PartKind<'dodecahedron'> = {
  id: 'dodecahedron',
  label: 'Dodecahedron',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new DodecahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('dodecahedron', dodecahedronKind.createGeometry(params), params),
};
