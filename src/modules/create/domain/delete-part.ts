import type { Material, Mesh, Texture } from 'three';

import { readCreatePart } from './part-data';

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value && (value as Texture).isTexture) {
      (value as Texture).dispose();
    }
  }
  material.dispose();
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
  mesh.geometry.dispose();

  const material = mesh.material;
  if (material) {
    const materials = Array.isArray(material) ? material : [material];
    for (const mat of materials) {
      disposeMaterial(mat);
    }
  }

  return true;
}
