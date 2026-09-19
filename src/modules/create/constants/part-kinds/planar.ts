import type { PartKind } from '@/modules/create/types/part';

import { CircleGeometry, PlaneGeometry, RingGeometry } from 'three';
import { withGroundOrigin } from '@/modules/create/domain/geometry-ground';
import { partMesh, regularPolygonGeometry } from './create-part-mesh';
import { DEFAULT_PART_SIZE as S } from './default-size';

/** Vertical panel on the ground; rotate -90 deg on X for a floor. */
export const planeKind: PartKind<'plane'> = {
  id: 'plane',
  label: 'Plane',
  defaultParams: { width: S, height: S },
  sizeFields: [
    { param: 'width', label: 'Width', min: 0.01 },
    { param: 'height', label: 'Height', min: 0.01 },
  ],
  createGeometry: ({ width, height }) =>
    withGroundOrigin(new PlaneGeometry(width, height), height / 2),
  createMesh: (params) =>
    partMesh('plane', planeKind.createGeometry(params), params),
};

/** Equilateral triangle panel (CircleGeometry with 3 sides). */
export const triangleKind: PartKind<'triangle'> = {
  id: 'triangle',
  label: 'Triangle',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(regularPolygonGeometry(radius, 3), radius),
  createMesh: (params) =>
    partMesh('triangle', triangleKind.createGeometry(params), params),
};

export const polygonKind: PartKind<'polygon'> = {
  id: 'polygon',
  label: 'Polygon',
  defaultParams: { radius: S, sides: 6 },
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

export const circleKind: PartKind<'circle'> = {
  id: 'circle',
  label: 'Circle',
  defaultParams: { radius: S },
  sizeFields: [{ param: 'radius', label: 'Radius', min: 0.01 }],
  createGeometry: ({ radius }) =>
    withGroundOrigin(new CircleGeometry(radius, 32), radius),
  createMesh: (params) =>
    partMesh('circle', circleKind.createGeometry(params), params),
};

export const ringKind: PartKind<'ring'> = {
  id: 'ring',
  label: 'Ring',
  defaultParams: { innerRadius: S / 2, outerRadius: S },
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
