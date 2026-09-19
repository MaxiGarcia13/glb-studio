import type { ClipLoadResult } from '@/modules/animation/types/clip';
import type { ModelLoadResult } from '@/modules/viewport/types/model';
import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { captureBindLengths } from '@/modules/animation/domain/bone-registry';
import { hoistRootTransform } from '@/modules/viewport/domain/hoist-root-transform';
import { parseGltfFile, stripAssetExtension } from '@/utils/glb-parse';
import {
  isUsableCreatedModelScene,
  isUsableSkinnedModelScene,
} from '../domain/model-scene-kind';
import {
  readModelGroupManifest,
  splitModelGroupScene,
} from '../domain/split-model-group';
import { ensureGltfFile } from '../services/ensure-gltf-file';

export interface PendingModelGroupImport {
  name: string;
  /** Indexes into `models` for this batch that form the group. */
  modelIndexes: number[];
}

export interface ContentRouterResult {
  models: ModelLoadResult[];
  sharedClips: ClipLoadResult[];
  errors: string[];
  /** Editor model groups to recreate after `importModelResults`. */
  groupsToCreate: PendingModelGroupImport[];
}

/**
 * Parse each file once and route by content:
 * stamped multi-model group GLB → split into members + pending group;
 * skinned mesh + skeleton → imported model;
 * mesh-only → created model (re-import of exported New models);
 * animations only → shared clip library;
 * otherwise a per-file error. Batch continues past failed files.
 */
export async function routeContentImport(files: File[]): Promise<ContentRouterResult> {
  const models: ModelLoadResult[] = [];
  const sharedClips: ClipLoadResult[] = [];
  const errors: string[] = [];
  const groupsToCreate: PendingModelGroupImport[] = [];

  for (const file of files) {
    let blobUrl: string | undefined;
    try {
      const gltfFile = await ensureGltfFile(file);
      const { gltf, blobUrl: parsedBlobUrl } = await parseGltfFile(gltfFile);
      blobUrl = parsedBlobUrl;

      const manifest = readModelGroupManifest(gltf.scene);
      if (manifest) {
        const split = splitModelGroupScene(
          gltf.scene,
          gltf.animations ?? [],
          manifest,
          gltfFile.name,
        );
        if (split) {
          for (const member of split.models) {
            hoistRootTransform(member.scene);
          }
          const startIndex = models.length;
          models.push(...split.models);
          groupsToCreate.push({
            name: split.groupName,
            modelIndexes: split.models.map((_, offset) => startIndex + offset),
          });
          URL.revokeObjectURL(blobUrl);
          blobUrl = undefined;
          continue;
        }
      }

      if (isUsableSkinnedModelScene(gltf.scene)) {
        hoistRootTransform(gltf.scene);
        models.push({
          fileName: gltfFile.name,
          scene: gltf.scene,
          blobUrl,
          animations: gltf.animations ?? [],
          source: 'imported',
        });
        blobUrl = undefined;
      } else if (isUsableCreatedModelScene(gltf.scene)) {
        hoistRootTransform(gltf.scene);
        models.push({
          fileName: gltfFile.name,
          scene: gltf.scene,
          blobUrl,
          animations: gltf.animations ?? [],
          source: 'created',
        });
        blobUrl = undefined;
      } else if (gltf.animations && gltf.animations.length > 0) {
        sharedClips.push({
          name: stripAssetExtension(gltfFile.name),
          clips: gltf.animations,
          sourceBindLengths: captureBindLengths(gltf.scene, gltf.animations),
          sourceBindFrames: captureBindFrames(gltf.scene, gltf.animations),
        });
        URL.revokeObjectURL(blobUrl);
        blobUrl = undefined;
      } else {
        URL.revokeObjectURL(blobUrl);
        blobUrl = undefined;
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

  return { models, sharedClips, errors, groupsToCreate };
}
