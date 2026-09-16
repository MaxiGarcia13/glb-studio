import type { Mesh, Object3D } from 'three';
import type { Kit } from '@/modules/create/types/kit';
import { MeshStandardMaterial } from 'three';
import { getPartKind } from './part-kind';

/**
 * Spawn every recipe part into `scene` with kit name, TRS, params, and color.
 * Does not apply the palette spawn X-offset — recipes own placement.
 */
export function instantiateKitParts(scene: Object3D, kit: Kit): Mesh[] {
  const meshes: Mesh[] = [];

  for (const recipe of kit.parts) {
    const kind = getPartKind(recipe.kind);
    const mesh = kind.createMesh({ ...recipe.params });
    mesh.name = recipe.name;
    mesh.position.set(...recipe.position);
    mesh.rotation.set(...recipe.rotation);
    if (recipe.scale) {
      mesh.scale.set(...recipe.scale);
    }

    const material = mesh.material;
    if (material instanceof MeshStandardMaterial) {
      material.color.set(recipe.color);
    }

    scene.add(mesh);
    meshes.push(mesh);
  }

  return meshes;
}
