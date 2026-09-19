import type { ClipLoadResult } from '../types/clip';
import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { captureBindLengths } from '@/modules/animation/domain/bone-registry';
import { ensureGltfFile } from '@/modules/import/services/ensure-gltf-file';
import { parseGltfFile } from '@/utils/glb-parse';

export async function loadClipsFromFile(file: File): Promise<ClipLoadResult> {
  let blobUrl: string | undefined;

  try {
    const gltfFile = await ensureGltfFile(file);
    const result = await parseGltfFile(gltfFile);
    blobUrl = result.blobUrl;
    const { gltf } = result;

    if (!gltf.animations || gltf.animations.length === 0) {
      throw new Error(`File "${file.name}" contains no animation clips`);
    }

    return {
      name: stripExtension(gltfFile.name),
      clips: gltf.animations,
      sourceBindLengths: captureBindLengths(gltf.scene, gltf.animations),
      sourceBindFrames: captureBindFrames(gltf.scene, gltf.animations),
    };
  } catch (error) {
    if (error instanceof Error && error.message === `File "${file.name}" contains no animation clips`) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Failed to load animation file';
    throw new Error(`Failed to load "${file.name}": ${message}`);
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}

const NAME_EXTENSION_PATTERN = /\.(?:glb|gltf|fbx)$/i;

function stripExtension(name: string): string {
  return name.replace(NAME_EXTENSION_PATTERN, '');
}
