import type { MeshStandardMaterial, Texture } from 'three';
import type { SessionSkinEntry } from '../types/session-skins';

import {
  ImageTextureError,
} from '../adapters/load-image-texture';
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

export interface ApplySkinnedSessionSkinsResult {
  entries: SessionSkinEntry[];
  errors: string[];
}

function errorMessageForFile(file: File, cause: unknown): string {
  if (cause instanceof ImageTextureError || cause instanceof Error) {
    return cause.message;
  }
  return `Could not load “${file.name}”.`;
}

/**
 * Decode one or more local images and append each success to the wardrobe.
 * The **last** successful texture becomes live (one material undo commit).
 * Failed files add nothing and do not block other successes.
 */
export async function applySkinnedSessionSkinsFromFiles(options: {
  modelId: string;
  meshUuid: string;
  material: MeshStandardMaterial;
  files: readonly File[];
}): Promise<ApplySkinnedSessionSkinsResult> {
  const { modelId, meshUuid, material, files } = options;
  const entries: SessionSkinEntry[] = [];
  const errors: string[] = [];
  let lastTexture: Texture | null = null;

  for (const file of files) {
    try {
      const texture = await loadSkinnedColorMapFromFile(file);
      entries.push(appendSessionSkin(modelId, { texture }));
      lastTexture = texture;
    } catch (cause) {
      errors.push(errorMessageForFile(file, cause));
    }
  }

  if (lastTexture) {
    commitMaterialColorMapChange({
      modelId,
      meshUuid,
      material,
      next: lastTexture,
    });
  }

  return { entries, errors };
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
  const result = await applySkinnedSessionSkinsFromFiles({
    modelId: options.modelId,
    meshUuid: options.meshUuid,
    material: options.material,
    files: [options.file],
  });
  const entry = result.entries[0];
  if (!entry) {
    throw new ImageTextureError(
      result.errors[0] ?? `Could not load “${options.file.name}”.`,
    );
  }
  return entry;
}
