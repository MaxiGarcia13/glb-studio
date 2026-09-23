import type { Mesh, MeshStandardMaterial, Object3D } from 'three';
import { readCreatePart } from '@/modules/create/domain/part-data';
import { findMeshStandardMaterial } from '@/modules/create/utils/selected-part';
import { labelForColorMap } from './color-map-label';

export interface PartColorMapEntry {
  mesh: Mesh;
  material: MeshStandardMaterial;
  /** Library row label (texture name; fallback “Texture”). */
  label: string;
}

/**
 * Current color map on a stamped created part, or null when missing / no `.map`.
 * Groups and non-create meshes return null (no multi-skin list on created parts).
 */
export function readPartColorMapEntry(
  object: Object3D,
): PartColorMapEntry | null {
  if (!readCreatePart(object)) {
    return null;
  }

  const material = findMeshStandardMaterial(object);
  const map = material?.map ?? null;
  if (!material || !map) {
    return null;
  }

  return {
    mesh: object as Mesh,
    material,
    label: labelForColorMap(map),
  };
}
