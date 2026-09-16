import type { Kit } from '@/modules/create/types/kit';

/** Footprint width/depth in metres (centred on origin). */
const FOOTPRINT = 4;
/** Wall height in metres; roof sits on this. */
const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.15;
const ROOF_OVERHANG = 0.2;

/**
 * PlaneGeometry is a vertical XY panel (bottom on y = 0). −90° about X lays it
 * in XZ facing +Y; then +Z local offset of `size / 2` recentres the rectangle.
 */
const FLAT_PLANE_ROTATION = [-Math.PI / 2, 0, 0] as const;

const FLOOR_COLOR = '#a67c52';
const WALL_COLOR = '#e8e0d4';
const ROOF_COLOR = '#5c6670';

const roofSize = FOOTPRINT + ROOF_OVERHANG * 2;

/**
 * Starter house from existing `box` / `plane` kinds — metres, grounded, named parts.
 * Instantiate in the From kit flow (US-27); New model stays empty.
 */
export const SIMPLE_BUILDING_KIT: Kit<'simple-building'> = {
  id: 'simple-building',
  label: 'Simple building',
  description: 'A small house with a floor, four walls, and a flat roof.',
  parts: [
    {
      kind: 'plane',
      name: 'floor',
      position: [0, 0, FOOTPRINT / 2],
      rotation: [...FLAT_PLANE_ROTATION],
      params: { width: FOOTPRINT, height: FOOTPRINT },
      color: FLOOR_COLOR,
    },
    {
      kind: 'box',
      name: 'wall_front',
      position: [0, 0, FOOTPRINT / 2],
      rotation: [0, 0, 0],
      params: { width: FOOTPRINT, height: WALL_HEIGHT, depth: WALL_THICKNESS },
      color: WALL_COLOR,
    },
    {
      kind: 'box',
      name: 'wall_back',
      position: [0, 0, -FOOTPRINT / 2],
      rotation: [0, 0, 0],
      params: { width: FOOTPRINT, height: WALL_HEIGHT, depth: WALL_THICKNESS },
      color: WALL_COLOR,
    },
    {
      kind: 'box',
      name: 'wall_left',
      position: [-FOOTPRINT / 2, 0, 0],
      rotation: [0, 0, 0],
      params: { width: WALL_THICKNESS, height: WALL_HEIGHT, depth: FOOTPRINT },
      color: WALL_COLOR,
    },
    {
      kind: 'box',
      name: 'wall_right',
      position: [FOOTPRINT / 2, 0, 0],
      rotation: [0, 0, 0],
      params: { width: WALL_THICKNESS, height: WALL_HEIGHT, depth: FOOTPRINT },
      color: WALL_COLOR,
    },
    {
      kind: 'plane',
      name: 'roof',
      position: [0, WALL_HEIGHT, roofSize / 2],
      rotation: [...FLAT_PLANE_ROTATION],
      params: { width: roofSize, height: roofSize },
      color: ROOF_COLOR,
    },
  ],
};
