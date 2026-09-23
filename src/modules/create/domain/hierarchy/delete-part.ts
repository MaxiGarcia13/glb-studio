import type { Material, Mesh, Object3D, Texture } from 'three';

import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { readCreatePart } from '../part-data';
import { isCreateGroup, isCreateHierarchyNode } from './group-data';

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value && (value as Texture).isTexture) {
      disposeImageTexture(value as Texture);
    }
  }
  material.dispose();
}

function disposeMeshResources(mesh: Mesh): void {
  mesh.geometry.dispose();
  const material = mesh.material;
  if (material) {
    const materials = Array.isArray(material) ? material : [material];
    for (const mat of materials) {
      disposeMaterial(mat);
    }
  }
}

/**
 * Remove a stamped create part from the scene and free its GPU resources.
 * Returns false when the mesh is not a stamped create part.
 */
export function deletePart(mesh: Mesh): boolean {
  if (!readCreatePart(mesh)) {
    return false;
  }

  mesh.removeFromParent();
  disposeMeshResources(mesh);
  return true;
}

/**
 * Remove a create hierarchy root (stamped part or create group + subtree).
 * Disposes GPU resources for every stamped mesh under the root.
 * Returns false when `root` is not a create hierarchy node.
 */
export function deleteCreateHierarchyRoot(root: Object3D): boolean {
  if (!isCreateHierarchyNode(root)) {
    return false;
  }

  const meshes: Mesh[] = [];
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.isMesh && readCreatePart(mesh)) {
      meshes.push(mesh);
    }
  });

  if (isCreateGroup(root)) {
    root.removeFromParent();
    for (const mesh of meshes) {
      disposeMeshResources(mesh);
    }
    return true;
  }

  const mesh = root as Mesh;
  mesh.removeFromParent();
  disposeMeshResources(mesh);
  return true;
}

/** Delete every root; returns how many roots were removed. */
export function deleteCreateHierarchyRoots(roots: readonly Object3D[]): number {
  let removed = 0;
  for (const root of roots) {
    if (deleteCreateHierarchyRoot(root)) {
      removed += 1;
    }
  }
  return removed;
}
