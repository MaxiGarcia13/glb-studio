import type { MeshStandardMaterial, Texture } from 'three';

import { replaceColorMap } from '../domain/material-color-map';
import { loadImageTexture } from './load-image-texture';

/**
 * Decode a local image and assign it as the material color map.
 * Failed decode leaves the live map untouched (no dispose). Shared by created
 * parts (when applying without a prep draft) and skinned albedo (US-40).
 */
export async function replaceMaterialColorMapFromFile(
  material: MeshStandardMaterial,
  file: File,
): Promise<Texture> {
  const texture = await loadImageTexture(file);
  replaceColorMap(material, texture);
  return texture;
}
