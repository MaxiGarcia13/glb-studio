import type { PartKind } from '@/modules/create/types/part';

import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { withGroundOrigin } from '@/modules/create/domain/geometry-ground';
import { partMesh } from './create-part-mesh';
import { DEFAULT_PART_SIZE as S } from './default-size';

export const boxKind: PartKind<'box'> = {
  id: 'box',
  label: 'Box',
  defaultParams: { width: S, height: S, depth: S },
  sizeFields: [
    { param: 'width', label: 'Width', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
    { param: 'depth', label: 'Depth', min: 0.01 },
  ],
  createGeometry: ({ width, height, depth }) =>
    withGroundOrigin(new BoxGeometry(width, height, depth), height / 2),
  createMesh: (params) => partMesh('box', boxKind.createGeometry(params), params),
};

export const sphereKind: PartKind<'sphere'> = {
  id: 'sphere',
  label: 'Sphere',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new SphereGeometry(radius, 32, 16), radius),
  createMesh: (params) => partMesh('sphere', sphereKind.createGeometry(params), params),
};

export const cylinderKind: PartKind<'cylinder'> = {
  id: 'cylinder',
  label: 'Cylinder',
  defaultParams: { radius: S, height: S },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createGeometry: ({ radius, height }) =>
    withGroundOrigin(new CylinderGeometry(radius, radius, height, 32), height / 2),
  createMesh: (params) =>
    partMesh('cylinder', cylinderKind.createGeometry(params), params),
};

export const capsuleKind: PartKind<'capsule'> = {
  id: 'capsule',
  label: 'Capsule',
  defaultParams: { radius: S, length: S },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'length', label: 'Length', min: 0.01 },
  ],
  createGeometry: ({ radius, length }) =>
    withGroundOrigin(
      new CapsuleGeometry(radius, length, 4, 8),
      length / 2 + radius,
    ),
  createMesh: (params) =>
    partMesh('capsule', capsuleKind.createGeometry(params), params),
};

export const coneKind: PartKind<'cone'> = {
  id: 'cone',
  label: 'Cone',
  defaultParams: { radius: S, height: S },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createGeometry: ({ radius, height }) =>
    withGroundOrigin(new ConeGeometry(radius, height, 32), height / 2),
  createMesh: (params) => partMesh('cone', coneKind.createGeometry(params), params),
};

export const torusKind: PartKind<'torus'> = {
  id: 'torus',
  label: 'Torus',
  defaultParams: { radius: S, tube: S * 0.4 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'tube', label: 'Tube', min: 0.01 },
  ],
  createGeometry: ({ radius, tube }) =>
    withGroundOrigin(new TorusGeometry(radius, tube, 12, 32), radius + tube),
  createMesh: (params) =>
    partMesh('torus', torusKind.createGeometry(params), params),
};
