import type { Mesh, Object3D } from 'three';

import { isCreateGroup, isCreateHierarchyNode } from './group-data';

export function isStrictDescendantOf(object: Object3D, ancestor: Object3D): boolean {
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

function isValidParent(parent: Object3D, partsRoot: Object3D): boolean {
  if (parent === partsRoot) {
    return true;
  }
  if (!isUnderPartsRoot(parent, partsRoot)) {
    return false;
  }
  return isCreateHierarchyNode(parent);
}

/**
 * Whether `child` may be attached under `parent` on this model (cycle-safe).
 * Child/parent may be create parts or empty create groups.
 */
export function canAttachUnder(
  child: Object3D,
  parent: Object3D,
  partsRoot: Object3D,
): boolean {
  if (!isCreateHierarchyNode(child)) {
    return false;
  }

  if (!isUnderPartsRoot(child, partsRoot)) {
    return false;
  }

  if (!isValidParent(parent, partsRoot)) {
    return false;
  }

  if (child === parent) {
    return false;
  }

  if (isStrictDescendantOf(parent, child)) {
    return false;
  }

  return true;
}

/** @deprecated Prefer canAttachUnder — kept for mesh-only call sites. */
export function canParentPart(
  child: Mesh,
  parent: Object3D,
  partsRoot: Object3D,
): boolean {
  return canAttachUnder(child, parent, partsRoot);
}

/**
 * Reparent a create hierarchy node under another node or the parts root,
 * preserving world transform via `Object3D.attach`.
 */
export function attachUnder(
  child: Object3D,
  parent: Object3D,
  partsRoot: Object3D,
): boolean {
  if (!canAttachUnder(child, parent, partsRoot)) {
    return false;
  }

  if (child.parent === parent) {
    return true;
  }

  parent.attach(child);
  return true;
}

/**
 * Reparent a stamped create part under another part, group, or the parts root,
 * preserving world transform via `Object3D.attach`.
 */
export function parentPart(
  child: Mesh,
  parent: Object3D,
  partsRoot: Object3D,
): boolean {
  return attachUnder(child, parent, partsRoot);
}

/**
 * Attach each node under `parent` (world-preserving). Skips already-parented /
 * invalid / cycle cases. Returns how many were actually reparented.
 */
export function attachAllUnder(
  parent: Object3D,
  children: readonly Object3D[],
  partsRoot: Object3D,
): number {
  let moved = 0;
  for (const child of children) {
    if (child === parent || child.parent === parent) {
      continue;
    }
    if (attachUnder(child, parent, partsRoot)) {
      moved += 1;
    }
  }
  return moved;
}

/** @deprecated Prefer attachAllUnder with an empty group parent. */
export function groupPartsUnder(
  active: Mesh,
  children: readonly Mesh[],
  partsRoot: Object3D,
): number {
  return attachAllUnder(active, children, partsRoot);
}

/**
 * Move each hierarchy node under `partsRoot` (world-preserving).
 * Skips nodes already at root. Returns how many were reparented.
 */
export function ungroupPartsToRoot(
  nodes: readonly Object3D[],
  partsRoot: Object3D,
): number {
  let moved = 0;
  for (const node of nodes) {
    if (node.parent === partsRoot) {
      continue;
    }
    if (attachUnder(node, partsRoot, partsRoot)) {
      moved += 1;
    }
  }
  return moved;
}

/**
 * Dissolve empty create groups: children attach to the group's former parent
 * (or parts root), then the group is removed. Returns dissolved count.
 */
export function dissolveCreateGroups(
  groups: readonly Object3D[],
  partsRoot: Object3D,
): number {
  let dissolved = 0;
  for (const group of groups) {
    if (!isCreateGroup(group) || !isUnderPartsRoot(group, partsRoot)) {
      continue;
    }

    const destination = group.parent && group.parent !== group
      ? group.parent
      : partsRoot;
    const children = [...group.children];
    for (const child of children) {
      if (isCreateHierarchyNode(child)) {
        destination.attach(child);
      }
    }
    group.removeFromParent();
    dissolved += 1;
  }
  return dissolved;
}
