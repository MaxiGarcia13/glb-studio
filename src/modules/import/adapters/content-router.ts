import type { ClipLoadResult } from '@/modules/animation/types/clip';
import type { ModelLoadResult } from '@/modules/viewport/types/model';
import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { captureBindLengths } from '@/modules/animation/domain/bone-registry';
import { hoistRootTransform } from '@/modules/viewport/domain/hoist-root-transform';
import { parseGltfFile } from '@/utils/glb-parse';
import { ensureGltfFile } from '../services/ensure-gltf-file';

export interface ContentRouterResult {
  models: ModelLoadResult[];
  sharedClips: ClipLoadResult[];
  errors: string[];
}

const NAME_EXTENSION_PATTERN = /\.(?:glb|gltf|fbx)$/i;

function stripExtension(name: string): string {
  return name.replace(NAME_EXTENSION_PATTERN, '');
}

function isUsableModelScene(scene: ModelLoadResult['scene']): boolean {
  let hasSkinnedMesh = false;
  let hasSkeleton = false;

  scene.traverse((child) => {
    const skinned = child as { isSkinnedMesh?: boolean; skeleton?: unknown };
    if (skinned.isSkinnedMesh) {
      hasSkinnedMesh = true;
      if (skinned.skeleton) {
        hasSkeleton = true;
      }
    }
  });

  return hasSkinnedMesh && hasSkeleton;
}

/**
 * Parse each file once and route by content: usable skinned model → model
 * library; animations only → shared clip library; otherwise a per-file error.
 * Batch continues past failed files.
 */
export async function routeContentImport(files: File[]): Promise<ContentRouterResult> {
  const models: ModelLoadResult[] = [];
  const sharedClips: ClipLoadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    let blobUrl: string | undefined;
    try {
      const gltfFile = await ensureGltfFile(file);
      const { gltf, blobUrl: parsedBlobUrl } = await parseGltfFile(gltfFile);
      blobUrl = parsedBlobUrl;

      if (isUsableModelScene(gltf.scene)) {
        hoistRootTransform(gltf.scene);
        models.push({
          fileName: gltfFile.name,
          scene: gltf.scene,
          blobUrl,
          animations: gltf.animations ?? [],
        });
      } else if (gltf.animations && gltf.animations.length > 0) {
        sharedClips.push({
          name: stripExtension(gltfFile.name),
          clips: gltf.animations,
          sourceBindLengths: captureBindLengths(gltf.scene),
          sourceBindFrames: captureBindFrames(gltf.scene),
        });
        URL.revokeObjectURL(blobUrl);
      } else {
        URL.revokeObjectURL(blobUrl);
        errors.push(`${gltfFile.name}: no usable model or animation clips found`);
      }
    } catch (error) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      const message = error instanceof Error ? error.message : 'Failed to import file';
      errors.push(`${file.name}: ${message}`);
    }
  }

  return { models, sharedClips, errors };
}
