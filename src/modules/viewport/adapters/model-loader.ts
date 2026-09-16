import type { SkinnedMesh } from 'three';
import type * as THREE from 'three';
import type { ModelLoadResult } from '../types/model';
import { ensureGltfFile } from '@/modules/import/services/ensure-gltf-file';
import { parseGltfFile } from '@/utils/glb-parse';
import { hoistRootTransform } from '../domain/hoist-root-transform';

function validateScene(scene: THREE.Group): void {
  let hasSkinnedMesh = false;
  let hasSkeleton = false;

  scene.traverse((child) => {
    if ((child as SkinnedMesh).isSkinnedMesh) {
      hasSkinnedMesh = true;
      if ((child as SkinnedMesh).skeleton) {
        hasSkeleton = true;
      }
    }
  });

  if (!hasSkinnedMesh) {
    throw new Error('Model has no skinned mesh');
  }

  if (!hasSkeleton) {
    throw new Error('Model has no skeleton');
  }
}

export async function loadModelFromFile(file: File): Promise<ModelLoadResult> {
  const gltfFile = await ensureGltfFile(file);
  const { gltf, blobUrl } = await parseGltfFile(gltfFile);

  try {
    validateScene(gltf.scene);
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    throw error;
  }

  // GLTF often keeps orientation on a child / wrapper while gltf.scene is identity.
  // Hoist onto the scene root so Settings + Move match the visible model.
  hoistRootTransform(gltf.scene);

  return {
    fileName: gltfFile.name,
    scene: gltf.scene,
    blobUrl,
    animations: gltf.animations ?? [],
    source: 'imported',
  };
}
