import type * as THREE from 'three';
import type { Mesh, MeshStandardMaterial } from 'three';

export function toHexColor(material: MeshStandardMaterial): string {
  return `#${material.color.getHexString()}`;
}

export function asMesh(object: THREE.Object3D | null): Mesh | null {
  if (!object) {
    return null;
  }
  const mesh = object as Mesh;
  if (!mesh.isMesh) {
    return null;
  }
  return mesh;
}

export function findMeshStandardMaterial(
  object: THREE.Object3D | null,
): MeshStandardMaterial | null {
  const mesh = asMesh(object);
  if (!mesh) {
    return null;
  }
  const mat = mesh.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
  if (!mat || Array.isArray(mat) || !('isMeshStandardMaterial' in mat)) {
    return null;
  }
  return mat;
}

export function isInActiveModelScene(
  object: THREE.Object3D,
  scene: THREE.Object3D | null,
): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current === scene) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
