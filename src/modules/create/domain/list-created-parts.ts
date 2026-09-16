import type { Mesh, Object3D } from 'three';

import { isCreateGroup, isCreateHierarchyNode } from './group-data';
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
 * Does not include `partsRoot` itself or empty groups.
 */
export function listCreatedParts(partsRoot: Object3D): Mesh[] {
  return listCreatedPartEntries(partsRoot)
    .map((entry) => asCreatePartMesh(entry.object))
    .filter((mesh): mesh is Mesh => mesh !== null);
}

export interface CreatedPartEntry {
  /** Stamped create part mesh or empty create group. */
  object: Object3D;
  /** Nesting depth under the parts root (0 = direct child). */
  depth: number;
  /** True when this node has at least one create-hierarchy child. */
  hasChildren: boolean;
  /** Convenience: true when `object` is an empty create group. */
  isGroup: boolean;
}

/**
 * Hierarchy-ordered entries for the outliner (pre-order, with depth).
 * Includes empty create groups and stamped part meshes.
 */
export function listCreatedPartEntries(partsRoot: Object3D): CreatedPartEntry[] {
  const entries: CreatedPartEntry[] = [];

  function walk(node: Object3D, depth: number): void {
    for (const child of node.children) {
      if (!isCreateHierarchyNode(child)) {
        walk(child, depth);
        continue;
      }

      const hasChildren = child.children.some((grandChild) =>
        isCreateHierarchyNode(grandChild),
      );
      entries.push({
        object: child,
        depth,
        hasChildren,
        isGroup: isCreateGroup(child),
      });
      walk(child, depth + 1);
    }
  }

  walk(partsRoot, 0);
  return entries;
}
