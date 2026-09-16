import type { Mesh, Object3D } from 'three';

import { listCreatedParts } from './list-created-parts';
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
 * Stamped parts on the same model that may parent `child`
 * (excludes `child` and its descendants to avoid cycles).
 */
export function listParentCandidates(child: Mesh, partsRoot: Object3D): Mesh[] {
  if (!readCreatePart(child) || !isUnderPartsRoot(child, partsRoot)) {
    return [];
  }

  return listCreatedParts(partsRoot).filter(
    (candidate) =>
      candidate !== child && !isStrictDescendantOf(candidate, child),
  );
}

/**
 * Whether `child` may be parented under `parent` on this model (cycle-safe).
 * Does not mutate the graph.
 */
export function canParentPart(
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

  return true;
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
  if (!canParentPart(child, parent, partsRoot)) {
    return false;
  }

  if (child.parent === parent) {
    return true;
  }

  parent.attach(child);
  return true;
}

/**
 * Parent each child under `active` (world-preserving). Skips self, already-parented,
 * and cycle/invalid cases. Returns how many parts were actually reparented.
 */
export function groupPartsUnder(
  active: Mesh,
  children: readonly Mesh[],
  partsRoot: Object3D,
): number {
  let moved = 0;
  for (const child of children) {
    if (child === active || child.parent === active) {
      continue;
    }
    if (parentPart(child, active, partsRoot)) {
      moved += 1;
    }
  }
  return moved;
}

/** Move a stamped create part under the parts root, preserving world transform. */
export function unparentPart(child: Mesh, partsRoot: Object3D): boolean {
  return parentPart(child, partsRoot, partsRoot);
}

/**
 * Move each part under `partsRoot` (world-preserving). Skips parts already at root
 * and invalid cases. Returns how many were actually reparented.
 */
export function ungroupPartsToRoot(
  parts: readonly Mesh[],
  partsRoot: Object3D,
): number {
  let moved = 0;
  for (const part of parts) {
    if (part.parent === partsRoot) {
      continue;
    }
    if (unparentPart(part, partsRoot)) {
      moved += 1;
    }
  }
  return moved;
}

/** Parent uuid for a part, or `null` when parented to the parts root. */
export function currentParentId(
  child: Object3D,
  partsRoot: Object3D,
): string | null {
  const parent = child.parent;
  if (!parent || parent === partsRoot) {
    return null;
  }
  return parent.uuid;
}
