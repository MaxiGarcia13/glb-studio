import type { MeshStandardMaterial, Texture } from 'three';
import type { SessionSkinEntry } from '../types/session-skins';

import { loadSkinnedColorMapFromFile } from '../adapters/replace-material-color-map-from-file';
import { appendSessionSkin } from '../stores/session-skins-store';
import { commitMaterialColorMapChange } from './commit-material-color-map';

/**
 * Append a decoded skinned color map to the session wardrobe and make it live.
 * Always appends (never replace-in-place). Failed decode must not call this.
 */
export function applySkinnedSessionSkinTexture(options: {
  modelId: string;
  meshUuid: string;
  material: MeshStandardMaterial;
  texture: Texture;
}): SessionSkinEntry {
  const { modelId, meshUuid, material, texture } = options;
  const entry = appendSessionSkin(modelId, { texture });
  commitMaterialColorMapChange({
    modelId,
    meshUuid,
    material,
    next: texture,
  });
  return entry;
}

/**
 * Decode a local image and append it as the active session skin (US-40 / US-48).
 * Throws on failed decode — wardrobe and undo stack stay unchanged.
 */
export async function applySkinnedSessionSkinFromFile(options: {
  modelId: string;
  meshUuid: string;
  material: MeshStandardMaterial;
  file: File;
}): Promise<SessionSkinEntry> {
  const texture = await loadSkinnedColorMapFromFile(options.file);
  return applySkinnedSessionSkinTexture({
    modelId: options.modelId,
    meshUuid: options.meshUuid,
    material: options.material,
    texture,
  });
}
