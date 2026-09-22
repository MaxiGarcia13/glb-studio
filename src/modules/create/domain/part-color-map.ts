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
 * Commit a prep-modal draft onto the live part material and free the previous
 * map when it is a different texture instance.
 */
export function commitPartColorMapDraft(
  material: MeshStandardMaterial,
  draft: Texture,
): void {
  const previous = material.map;
  applyPartColorMap(material, draft);
  if (previous && previous !== draft) {
    disposeImageTexture(previous);
  }
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
