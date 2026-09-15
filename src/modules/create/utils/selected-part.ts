import type * as THREE from 'three';
import type { MeshStandardMaterial } from 'three';

export function toHexColor(material: MeshStandardMaterial): string {
  return `#${material.color.getHexString()}`;
}

export function findMeshStandardMaterial(
  object: THREE.Object3D | null,
): MeshStandardMaterial | null {
  if (!object) {
    return null;
  }
  const mesh = object as { material?: unknown; isMesh?: boolean };
  if (!mesh.isMesh) {
    return null;
  }
  const mat = mesh.material as MeshStandardMaterial | undefined;
  if (!mat || !('isMeshStandardMaterial' in mat)) {
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
