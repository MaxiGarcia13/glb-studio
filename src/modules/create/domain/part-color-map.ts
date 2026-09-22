import type { MeshStandardMaterial, Texture } from 'three';

import { disposeImageTexture } from '../utils/dispose-image-texture';

/**
 * Assign a color map on a create-part material. Leaves `color` alone so it
 * continues to multiply the map. Caller is responsible for disposing any
 * previous map (e.g. via `loadImageTexture(..., material.map)`).
 */
export function applyPartColorMap(
  material: MeshStandardMaterial,
  texture: Texture,
): void {
  material.map = texture;
  material.needsUpdate = true;
}

/**
 * Remove the color map and free its GPU / ImageBitmap resources.
 * Flat `color` is unchanged.
 */
export function clearPartColorMap(material: MeshStandardMaterial): void {
  const previous = material.map;
  material.map = null;
  material.needsUpdate = true;
  disposeImageTexture(previous);
}
