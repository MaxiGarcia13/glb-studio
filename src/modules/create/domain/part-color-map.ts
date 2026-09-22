import type { MeshStandardMaterial, Texture } from 'three';

import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { syncMaterialMapAlpha } from './texture-map-alpha';

/**
 * Assign a color map on a create-part material. Leaves `color` alone so it
 * continues to multiply the map. Caller is responsible for disposing any
 * previous map (e.g. via `loadImageTexture(..., material.map)`).
 * Enables transparent cutouts when the map has alpha.
 */
export function applyPartColorMap(
  material: MeshStandardMaterial,
  texture: Texture,
): void {
  material.map = texture;
  syncMaterialMapAlpha(material, texture);
  material.needsUpdate = true;
}

/**
 * Remove the color map and free its GPU / ImageBitmap resources.
 * Flat `color` is unchanged. Clears cutout / transparent mode.
 */
export function clearPartColorMap(material: MeshStandardMaterial): void {
  const previous = material.map;
  material.map = null;
  syncMaterialMapAlpha(material, null);
  material.needsUpdate = true;
  disposeImageTexture(previous);
}
