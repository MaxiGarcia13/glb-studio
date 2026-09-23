import type { MeshStandardMaterial, Texture } from 'three';

import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { syncMaterialMapAlpha } from './texture-map-alpha';

/**
 * Assign a color map on a MeshStandardMaterial (created parts + skinned meshes).
 * Leaves `color` alone so it continues to multiply the map. Caller is responsible
 * for disposing any previous map unless using `replaceColorMap`.
 * Enables transparent cutouts when the map has alpha.
 */
export function applyColorMap(
  material: MeshStandardMaterial,
  texture: Texture,
): void {
  material.map = texture;
  syncMaterialMapAlpha(material, texture);
  material.needsUpdate = true;
}

/**
 * Assign a color map and free the previous map when it is a different texture
 * instance. Shared by US-39 prep Apply and US-40 skinned replace.
 */
export function replaceColorMap(
  material: MeshStandardMaterial,
  texture: Texture,
): void {
  const previous = material.map;
  applyColorMap(material, texture);
  if (previous && previous !== texture) {
    disposeImageTexture(previous);
  }
}

/**
 * Remove the color map and free its GPU / ImageBitmap resources.
 * Flat `color` is unchanged. Clears cutout / transparent mode.
 */
export function clearColorMap(material: MeshStandardMaterial): void {
  const previous = material.map;
  material.map = null;
  syncMaterialMapAlpha(material, null);
  material.needsUpdate = true;
  disposeImageTexture(previous);
}
