import type { Mesh, Object3D } from 'three';

import { readCreatePart } from './part-data';

function isStrictDescendantOf(object: Object3D, ancestor: Object3D): boolean {
  let current: Object3D | null = object.parent;
  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isUnderPartsRoot(object: Object3D, partsRoot: Object3D): boolean {
  return object === partsRoot || isStrictDescendantOf(object, partsRoot);
}

/**
 * Reparent a stamped create part under another part or the parts root,
 * preserving world transform via `Object3D.attach`.
 *
 * Returns false when the child is not a create part, the parent is not the
 * parts root / a create part on the same model, or the move would create a cycle.
 */
export function parentPart(
  child: Mesh,
  parent: Object3D,
  partsRoot: Object3D,
): boolean {
  if (!readCreatePart(child)) {
    return false;
  }

  if (!isUnderPartsRoot(child, partsRoot)) {
    return false;
  }

  const parentIsRoot = parent === partsRoot;
  if (!parentIsRoot) {
    if (!readCreatePart(parent) || !isUnderPartsRoot(parent, partsRoot)) {
      return false;
    }
  }

  if (child === parent) {
    return false;
  }

  // Parenting under a descendant would cycle the graph.
  if (isStrictDescendantOf(parent, child)) {
    return false;
  }

  if (child.parent === parent) {
    return true;
  }

  parent.attach(child);
  return true;
}
