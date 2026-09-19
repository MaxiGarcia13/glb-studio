import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** HTML `<input type="file">` accept list for GLB/GLTF. */
export const GLTF_FILE_ACCEPT = '.glb,.gltf,.fbx';

/** Case-insensitive filename match for `.glb` / `.gltf`. */
export const GLTF_EXTENSION_PATTERN = /\.(?:glb|gltf)$/i;

/** Trailing `.glb` / `.gltf` / `.fbx` (case-insensitive) — import/export basenames. */
export const ASSET_EXTENSION_PATTERN = /\.(?:glb|gltf|fbx)$/i;

/** Strip trailing `.glb` / `.gltf` / `.fbx` from a filename. */
export function stripAssetExtension(name: string): string {
  return name.replace(ASSET_EXTENSION_PATTERN, '');
}

/**
 * If `previous` ends with `.glb`/`.gltf` and `next` has no extension, append the previous one.
 * Keeps a user-chosen `.glb`/`.gltf` (or any other suffix) as typed.
 */
export function preserveGltfExtension(next: string, previous: string): string {
  const previousExt = previous.match(GLTF_EXTENSION_PATTERN)?.[0];
  if (!previousExt || GLTF_EXTENSION_PATTERN.test(next)) {
    return next;
  }
  if (/\.[^./\\]+$/.test(next)) {
    return next;
  }
  return `${next}${previousExt}`;
}

export interface GltfParseResult {
  gltf: GLTF;
  blobUrl: string;
}

export async function parseGltfFile(file: File): Promise<GltfParseResult> {
  if (!GLTF_EXTENSION_PATTERN.test(file.name)) {
    throw new Error('Unsupported file type. Please use .glb or .gltf');
  }

  const blobUrl = URL.createObjectURL(file);

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.load(blobUrl, (result) => resolve(result), undefined, (error) => reject(error));
    });
    return { gltf, blobUrl };
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}
