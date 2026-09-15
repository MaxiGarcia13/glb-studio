import type { BufferGeometry } from 'three';

/**
 * Shift a Y-centered primitive so its bottom sits at local y = 0.
 * Metres + Y-up: place the mesh at the origin and it rests on the ground.
 */
export function withGroundOrigin(
  geometry: BufferGeometry,
  bottomToCenter: number,
): BufferGeometry {
  geometry.translate(0, bottomToCenter, 0);
  return geometry;
}
