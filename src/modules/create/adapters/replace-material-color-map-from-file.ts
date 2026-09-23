import type { MeshStandardMaterial, Texture } from 'three';

import { replaceColorMap } from '../domain/material-color-map';
import { loadImageTexture } from './load-image-texture';

/**
 * Decode a local image and assign it as the material color map.
 * Failed decode leaves the live map untouched (no dispose).
 * Uses `flipY: false` so UV atlas skins land correctly on glTF / skinned meshes
 * (US-40). Create-part prep keeps the default `flipY: true` via `loadImageTexture`.
 */
export async function replaceMaterialColorMapFromFile(
  material: MeshStandardMaterial,
  file: File,
): Promise<Texture> {
  const texture = await loadImageTexture(file, undefined, { flipY: false });
  replaceColorMap(material, texture);
  return texture;
}
