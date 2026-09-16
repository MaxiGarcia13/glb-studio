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
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
} from 'three';
import { withGroundOrigin } from './geometry-ground';
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
  mesh.name = kind;
  writeCreatePart(mesh, { kind, params: { ...params } });
  return mesh;
}

function regularPolygonGeometry(radius: number, sides: number): BufferGeometry {
  const segments = Math.max(3, Math.round(sides));
  return new CircleGeometry(radius, segments);
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
  createGeometry: ({ width, height, depth }) =>
    withGroundOrigin(new BoxGeometry(width, height, depth), height / 2),
  createMesh: (params) => partMesh('box', boxKind.createGeometry(params), params),
};

const sphereKind: PartKind<'sphere'> = {
  id: 'sphere',
  label: 'Sphere',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new SphereGeometry(radius, 32, 16), radius),
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
    withGroundOrigin(new CylinderGeometry(radius, radius, height, 32), height / 2),
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
  createGeometry: ({ radius, length }) =>
    withGroundOrigin(
      new CapsuleGeometry(radius, length, 4, 8),
      length / 2 + radius,
    ),
  createMesh: (params) =>
    partMesh('capsule', capsuleKind.createGeometry(params), params),
};

/** Vertical panel on the ground; rotate -90 deg on X for a floor. 2x2 m default. */
const planeKind: PartKind<'plane'> = {
  id: 'plane',
  label: 'Plane',
  defaultParams: { width: 2, height: 2 },
  sizeFields: [
    { param: 'width', label: 'Width', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createGeometry: ({ width, height }) =>
    withGroundOrigin(new PlaneGeometry(width, height), height / 2),
  createMesh: (params) =>
    partMesh('plane', planeKind.createGeometry(params), params),
};

const coneKind: PartKind<'cone'> = {
  id: 'cone',
  label: 'Cone',
  defaultParams: { radius: 0.5, height: 1 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createGeometry: ({ radius, height }) =>
    withGroundOrigin(new ConeGeometry(radius, height, 32), height / 2),
  createMesh: (params) => partMesh('cone', coneKind.createGeometry(params), params),
};

const torusKind: PartKind<'torus'> = {
  id: 'torus',
  label: 'Torus',
  defaultParams: { radius: 0.5, tube: 0.2 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    { param: 'tube', label: 'Tube', min: 0.01 },
  ],
  createGeometry: ({ radius, tube }) =>
    withGroundOrigin(new TorusGeometry(radius, tube, 12, 32), radius + tube),
  createMesh: (params) =>
    partMesh('torus', torusKind.createGeometry(params), params),
};

/** Equilateral triangle panel (CircleGeometry with 3 sides). */
const triangleKind: PartKind<'triangle'> = {
  id: 'triangle',
  label: 'Triangle',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(regularPolygonGeometry(radius, 3), radius),
  createMesh: (params) =>
    partMesh('triangle', triangleKind.createGeometry(params), params),
};

const polygonKind: PartKind<'polygon'> = {
  id: 'polygon',
  label: 'Polygon',
  defaultParams: { radius: 0.5, sides: 6 },
  sizeFields: [
    { param: 'radius', label: 'Radius', min: 0.01 },
    {
      param: 'sides',
      label: 'Sides',
      min: 3,
      step: 1,
      integer: true,
      unit: null,
    },
  ],
  createGeometry: ({ radius, sides }) =>
    withGroundOrigin(regularPolygonGeometry(radius, sides), radius),
  createMesh: (params) =>
    partMesh('polygon', polygonKind.createGeometry(params), params),
};

const circleKind: PartKind<'circle'> = {
  id: 'circle',
  label: 'Circle',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new CircleGeometry(radius, 32), radius),
  createMesh: (params) =>
    partMesh('circle', circleKind.createGeometry(params), params),
};

const ringKind: PartKind<'ring'> = {
  id: 'ring',
  label: 'Ring',
  defaultParams: { innerRadius: 0.25, outerRadius: 0.5 },
  sizeFields: [
    { param: 'innerRadius', label: 'Inner radius', min: 0.01 },
    { param: 'outerRadius', label: 'Outer radius', min: 0.01 },
  ],
  createGeometry: ({ innerRadius, outerRadius }) => {
    const inner = Math.min(innerRadius, outerRadius);
    const outer = Math.max(innerRadius, outerRadius);
    return withGroundOrigin(new RingGeometry(inner, outer, 32), outer);
  },
  createMesh: (params) => partMesh('ring', ringKind.createGeometry(params), params),
};

const tetrahedronKind: PartKind<'tetrahedron'> = {
  id: 'tetrahedron',
  label: 'Tetrahedron',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new TetrahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('tetrahedron', tetrahedronKind.createGeometry(params), params),
};

const octahedronKind: PartKind<'octahedron'> = {
  id: 'octahedron',
  label: 'Octahedron',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new OctahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('octahedron', octahedronKind.createGeometry(params), params),
};

const icosahedronKind: PartKind<'icosahedron'> = {
  id: 'icosahedron',
  label: 'Icosahedron',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new IcosahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('icosahedron', icosahedronKind.createGeometry(params), params),
};

const dodecahedronKind: PartKind<'dodecahedron'> = {
  id: 'dodecahedron',
  label: 'Dodecahedron',
  defaultParams: { radius: 0.5 },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new DodecahedronGeometry(radius), radius),
  createMesh: (params) =>
    partMesh('dodecahedron', dodecahedronKind.createGeometry(params), params),
};

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

  const clamped = Math.max(field.min, value);
  const nextValue = field.integer ? Math.round(clamped) : clamped;
  if (field.integer && nextValue < field.min) {
    return;
  }

  const nextParams = { ...record.params, [param]: nextValue };
  const createGeometry = kind.createGeometry as (
    params: PartSizeParams,
  ) => BufferGeometry;

  mesh.geometry.dispose();
  mesh.geometry = createGeometry(nextParams);
  writeCreatePart(mesh, { kind: record.kind, params: nextParams });
}
