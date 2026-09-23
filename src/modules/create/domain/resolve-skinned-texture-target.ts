import type {
  MeshStandardMaterial,
  Object3D,
  SkinnedMesh,
} from 'three';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';
import {
  findMeshStandardMaterial,
  isInActiveModelScene,
} from '../utils/selected-part';

export interface SkinnedTextureTarget {
  mesh: SkinnedMesh;
  material: MeshStandardMaterial;
}

export interface SkinnedTextureAvailability {
  enabled: boolean;
  /** Tooltip / control title: why texture apply is available or disabled. */
  reason: string;
  target: SkinnedTextureTarget | null;
}

function asSkinnedMesh(object: Object3D | null | undefined): SkinnedMesh | null {
  if (!object) {
    return null;
  }
  const skinned = object as SkinnedMesh;
  return skinned.isSkinnedMesh ? skinned : null;
}

/** Skinned meshes under `scene` (stable traverse order). */
export function listSkinnedMeshes(scene: Object3D): SkinnedMesh[] {
  const meshes: SkinnedMesh[] = [];
  scene.traverse((child) => {
    const skinned = asSkinnedMesh(child);
    if (skinned) {
      meshes.push(skinned);
    }
  });
  return meshes;
}

/**
 * Which SkinnedMesh receives an albedo map.
 * Selected SkinnedMesh in `scene` wins; else the sole skinned mesh; else null.
 */
export function resolveSkinnedTextureMesh(
  scene: Object3D,
  selected: Object3D | null | undefined,
): SkinnedMesh | null {
  const selectedSkinned = asSkinnedMesh(selected);
  if (selectedSkinned && isInActiveModelScene(selectedSkinned, scene)) {
    return selectedSkinned;
  }

  const meshes = listSkinnedMeshes(scene);
  return meshes.length === 1 ? meshes[0]! : null;
}

/**
 * Resolve mesh + MeshStandardMaterial for skinned albedo apply / clear.
 * Returns null when there is no clear mesh target or the material cannot hold a map.
 */
export function resolveSkinnedTextureTarget(
  scene: Object3D,
  selected: Object3D | null | undefined,
): SkinnedTextureTarget | null {
  const mesh = resolveSkinnedTextureMesh(scene, selected);
  if (!mesh) {
    return null;
  }

  const material = findMeshStandardMaterial(mesh);
  if (!material) {
    return null;
  }

  return { mesh, material };
}

/**
 * Whether skinned albedo apply / clear is available for the current focus / selection.
 * Gate: `isSkinnedLibraryModel` (import, kits, post–Skin model).
 */
export function getSkinnedTextureAvailability(
  activeModel: ModelEntry | null | undefined,
  selected: Object3D | null | undefined,
): SkinnedTextureAvailability {
  if (!activeModel || !isSkinnedLibraryModel(activeModel)) {
    return {
      enabled: false,
      reason: 'Focus a skinned model to apply a texture',
      target: null,
    };
  }

  const target = resolveSkinnedTextureTarget(activeModel.scene, selected);
  if (target) {
    return {
      enabled: true,
      reason: 'Apply a color map (prefer UV atlas skins)',
      target,
    };
  }

  const meshes = listSkinnedMeshes(activeModel.scene);
  if (meshes.length === 0) {
    return {
      enabled: false,
      reason: 'No skinned mesh to texture',
      target: null,
    };
  }

  if (meshes.length > 1) {
    return {
      enabled: false,
      reason: 'Select a skinned mesh to texture',
      target: null,
    };
  }

  return {
    enabled: false,
    reason: 'Material does not support a color map',
    target: null,
  };
}
