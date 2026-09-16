import type { Mesh, Object3D } from 'three';

import { readCreatePart } from './part-data';

function asCreatePartMesh(object: Object3D): Mesh | null {
  if (!readCreatePart(object)) {
    return null;
  }
  const mesh = object as Mesh;
  return mesh.isMesh ? mesh : null;
}

/**
 * Depth-first list of stamped create parts under a created model’s parts root.
 * Does not include `partsRoot` itself.
 */
export function listCreatedParts(partsRoot: Object3D): Mesh[] {
  return listCreatedPartEntries(partsRoot).map((entry) => entry.mesh);
}

export interface CreatedPartEntry {
  mesh: Mesh;
  /** Nesting depth under the parts root (0 = direct child). */
  depth: number;
}

/**
 * Hierarchy-ordered part entries for the outliner (pre-order, with depth).
 */
export function listCreatedPartEntries(partsRoot: Object3D): CreatedPartEntry[] {
  const entries: CreatedPartEntry[] = [];

  function walk(node: Object3D, depth: number): void {
    for (const child of node.children) {
      const mesh = asCreatePartMesh(child);
      if (mesh) {
        entries.push({ mesh, depth });
        walk(mesh, depth + 1);
        continue;
      }
      walk(child, depth);
    }
  }

  walk(partsRoot, 0);
  return entries;
}
