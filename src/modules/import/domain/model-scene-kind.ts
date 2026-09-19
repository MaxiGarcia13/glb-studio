import type { Mesh, Object3D } from 'three';
import type { ModelEntry, ModelLoadResult } from '@/modules/viewport/types/model';

/** Skinned character GLB: needs SkinnedMesh + skeleton. */
export function isUsableSkinnedModelScene(scene: ModelLoadResult['scene']): boolean {
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
 * Library models that should get SkeletonHelper + bone outliner (US-31 / US-34).
 * Imported skinned kits and in-editor skinned created models (`source → imported`).
 */
export function isSkinnedLibraryModel(model: ModelEntry): boolean {
  return model.source === 'imported' && isUsableSkinnedModelScene(model.scene);
}

/**
 * Mesh-only / created-model GLB: at least one Mesh that is not a SkinnedMesh.
 * Used to re-import exported New models (primitive parts, no skeleton).
 */
export function isUsableCreatedModelScene(scene: ModelLoadResult['scene']): boolean {
  let hasMesh = false;

  scene.traverse((child: Object3D) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const skinned = child as { isSkinnedMesh?: boolean };
    if (skinned.isSkinnedMesh) {
      return;
    }
    hasMesh = true;
  });

  return hasMesh;
}
