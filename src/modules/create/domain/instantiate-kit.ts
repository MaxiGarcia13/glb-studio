import type { Group, Mesh, Object3D } from 'three';
import type { MeshKit } from '@/modules/create/types/kit';
import { MeshStandardMaterial } from 'three';
import { createNamedCreateGroup } from './hierarchy/create-part-group';
import { attachUnder } from './hierarchy/parent-part';
import { getPartKind } from './part-kind';

/**
 * Spawn kit groups + parts into `scene`.
 * Recipe TRS is authored in world space; optional `parent` uses world-preserving attach
 * so armature groups sit at joint pivots for outliner / Edit parenting.
 */
export function instantiateKitParts(scene: Object3D, kit: MeshKit): Mesh[] {
  const groupsByName = new Map<string, Group>();

  for (const recipe of kit.groups ?? []) {
    const group = createNamedCreateGroup(scene, recipe.name);
    group.position.set(...recipe.position);
    if (recipe.rotation) {
      group.rotation.set(...recipe.rotation);
    }
    groupsByName.set(recipe.name, group);
  }

  for (const recipe of kit.groups ?? []) {
    if (!recipe.parent) {
      continue;
    }
    const child = groupsByName.get(recipe.name);
    const parent = groupsByName.get(recipe.parent);
    if (!child || !parent) {
      continue;
    }
    attachUnder(child, parent, scene);
  }

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

    if (recipe.parent) {
      const parent = groupsByName.get(recipe.parent);
      if (parent) {
        attachUnder(mesh, parent, scene);
      }
    }

    meshes.push(mesh);
  }

  return meshes;
}
