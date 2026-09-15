import type {
  PartKindId,
  PartSizeField,
  PartSizeParams,
} from '@/modules/create/types/part';

import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';

/** One registered primitive kind: how to build it and what the inspector edits. */
export interface PartKind<K extends PartKindId = PartKindId> {
  id: K;
  label: string;
  defaultParams: PartSizeParams<K>;
  sizeFields: readonly PartSizeField[];
  createMesh: (params: PartSizeParams<K>) => Mesh;
}

function partMesh(geometry: BoxGeometry | CapsuleGeometry | CylinderGeometry | SphereGeometry): Mesh {
  return new Mesh(geometry, new MeshStandardMaterial());
}

const boxKind: PartKind<'box'> = {
  id: 'box',
  label: 'Box',
  defaultParams: { width: 1, height: 1, depth: 1 },
  sizeFields: [
    { param: 'width', label: 'Width', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
    { param: 'depth', label: 'Depth', min: 0.01 },
  ],
  createMesh: ({ width, height, depth }) =>
    partMesh(new BoxGeometry(width, height, depth)),
};

const sphereKind: PartKind<'sphere'> = {
  id: 'sphere',
  label: 'Sphere',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createMesh: ({ radius }) => partMesh(new SphereGeometry(radius, 32, 16)),
};

const cylinderKind: PartKind<'cylinder'> = {
  id: 'cylinder',
  label: 'Cylinder',
  defaultParams: { radius: 0.5, height: 1 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createMesh: ({ radius, height }) =>
    partMesh(new CylinderGeometry(radius, radius, height, 32)),
};

const capsuleKind: PartKind<'capsule'> = {
  id: 'capsule',
  label: 'Capsule',
  defaultParams: { radius: 0.5, length: 1 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'length', label: 'Length', min: 0.01 },
  ],
  createMesh: ({ radius, length }) =>
    partMesh(new CapsuleGeometry(radius, length, 4, 8)),
};

export const PART_KINDS: { [K in PartKindId]: PartKind<K> } = {
  box: boxKind,
  sphere: sphereKind,
  cylinder: cylinderKind,
  capsule: capsuleKind,
};

export function getPartKind<K extends PartKindId>(id: K): PartKind<K> {
  return PART_KINDS[id];
}

export function listPartKinds(): PartKind[] {
  return (Object.values(PART_KINDS) as PartKind[]);
}
