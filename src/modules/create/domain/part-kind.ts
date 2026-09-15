import type { BufferGeometry } from 'three';
import type {
  PartKindId,
  PartSizeField,
  PartSizeParamKey,
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
import { readCreatePart, writeCreatePart } from './part-data';

/** One registered primitive kind: how to build it and what the inspector edits. */
export interface PartKind<K extends PartKindId = PartKindId> {
  id: K;
  label: string;
  defaultParams: PartSizeParams<K>;
  sizeFields: readonly PartSizeField[];
  createGeometry: (params: PartSizeParams<K>) => BufferGeometry;
  createMesh: (params: PartSizeParams<K>) => Mesh;
}

function partMesh<K extends PartKindId>(
  kind: K,
  geometry: BufferGeometry,
  params: PartSizeParams<K>,
): Mesh {
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  writeCreatePart(mesh, { kind, params: { ...params } });
  return mesh;
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
  createGeometry: ({ width, height, depth }) => new BoxGeometry(width, height, depth),
  createMesh: (params) => partMesh('box', boxKind.createGeometry(params), params),
};

const sphereKind: PartKind<'sphere'> = {
  id: 'sphere',
  label: 'Sphere',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) => new SphereGeometry(radius, 32, 16),
  createMesh: (params) => partMesh('sphere', sphereKind.createGeometry(params), params),
};

const cylinderKind: PartKind<'cylinder'> = {
  id: 'cylinder',
  label: 'Cylinder',
  defaultParams: { radius: 0.5, height: 1 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createGeometry: ({ radius, height }) =>
    new CylinderGeometry(radius, radius, height, 32),
  createMesh: (params) =>
    partMesh('cylinder', cylinderKind.createGeometry(params), params),
};

const capsuleKind: PartKind<'capsule'> = {
  id: 'capsule',
  label: 'Capsule',
  defaultParams: { radius: 0.5, length: 1 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'length', label: 'Length', min: 0.01 },
  ],
  createGeometry: ({ radius, length }) => new CapsuleGeometry(radius, length, 4, 8),
  createMesh: (params) =>
    partMesh('capsule', capsuleKind.createGeometry(params), params),
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
  return Object.values(PART_KINDS) as PartKind[];
}

/**
 * Rebuild mesh geometry from kind size params. Keeps material and local TRS.
 * No-op when the mesh is not a stamped create part or the param is not for its kind.
 */
export function setPartSizeParam(
  mesh: Mesh,
  param: PartSizeParamKey,
  value: number,
): void {
  if (!Number.isFinite(value)) {
    return;
  }

  const record = readCreatePart(mesh);
  if (!record) {
    return;
  }

  const kind = getPartKind(record.kind);
  const field = kind.sizeFields.find((entry) => entry.param === param);
  if (!field) {
    return;
  }

  const nextValue = Math.max(field.min, value);
  const nextParams = { ...record.params, [param]: nextValue };
  const createGeometry = kind.createGeometry as (
    params: PartSizeParams,
  ) => BufferGeometry;

  mesh.geometry.dispose();
  mesh.geometry = createGeometry(nextParams);
  writeCreatePart(mesh, { kind: record.kind, params: nextParams });
}
