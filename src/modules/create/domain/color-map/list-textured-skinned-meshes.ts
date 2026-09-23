import type {
  MeshStandardMaterial,
  Object3D,
  SkinnedMesh,
  Texture,
} from 'three';

import { findMeshStandardMaterial } from '@/modules/create/utils/selected-part';
import { labelForColorMap } from './color-map-label';
import { listSkinnedMeshes } from './resolve-skinned-texture-target';

export interface TexturedSkinnedMeshEntry {
  mesh: SkinnedMesh;
  material: MeshStandardMaterial;
  /** Library row label (texture name, optionally with mesh name). */
  label: string;
}

function meshLabel(mesh: SkinnedMesh): string | null {
  const name = mesh.name.trim();
  return name.length > 0 ? name : null;
}

/**
 * Display label for a textured skinned mesh row.
 * Prefer `texture.name`; fallback `"Texture"`. Include mesh name when useful
 * (multi-mesh lists with a named mesh).
 */
export function labelForTexturedSkinnedMesh(
  mesh: SkinnedMesh,
  texture: Texture,
  options: { includeMeshName: boolean },
): string {
  const fromMap = labelForColorMap(texture);
  if (!options.includeMeshName) {
    return fromMap;
  }

  const fromMesh = meshLabel(mesh);
  if (!fromMesh) {
    return fromMap;
  }
  if (fromMap === 'Texture') {
    return fromMesh;
  }
  return `${fromMesh} · ${fromMap}`;
}

/**
 * Skinned meshes under `scene` that currently have a standard-material `.map`.
 * Stable traverse order (same as `listSkinnedMeshes`). Empty when none.
 */
export function listTexturedSkinnedMeshes(
  scene: Object3D,
): TexturedSkinnedMeshEntry[] {
  const textured: Array<{
    mesh: SkinnedMesh;
    material: MeshStandardMaterial;
    map: Texture;
  }> = [];

  for (const mesh of listSkinnedMeshes(scene)) {
    const material = findMeshStandardMaterial(mesh);
    const map = material?.map ?? null;
    if (!material || !map) {
      continue;
    }
    textured.push({ mesh, material, map });
  }

  const includeMeshName = textured.length > 1;
  return textured.map(({ mesh, material, map }) => ({
    mesh,
    material,
    label: labelForTexturedSkinnedMesh(mesh, map, { includeMeshName }),
  }));
}
