import type { MeshStandardMaterial, Texture } from 'three';

import { replaceColorMap } from '../domain/material-color-map';
import { loadImageTexture } from './load-image-texture';

/**
 * Decode a local image for a skinned / glTF UV atlas (`flipY: false`).
 * Does not assign — caller commits via `commitMaterialColorMapChange` (US-46)
 * or `replaceColorMap` for non-undo paths. Failed decode throws; live map untouched.
 */
export async function loadSkinnedColorMapFromFile(file: File): Promise<Texture> {
  return loadImageTexture(file, undefined, { flipY: false });
}

/**
 * Decode and assign without an undo entry. Prefer
 * `loadSkinnedColorMapFromFile` + `commitMaterialColorMapChange` in UI.
 */
export async function replaceMaterialColorMapFromFile(
  material: MeshStandardMaterial,
  file: File,
): Promise<Texture> {
  const texture = await loadSkinnedColorMapFromFile(file);
  replaceColorMap(material, texture);
  return texture;
}
