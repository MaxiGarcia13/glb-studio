import type { Object3D } from 'three';
import { isCreateGroup } from './group-data';
import { readCreatePart } from './part-data';

/** Nearest create-group ancestor, or null. */
export function findNearestCreateGroup(picked: Object3D): Object3D | null {
  let current: Object3D | null = picked.parent;
  while (current) {
    if (isCreateGroup(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Edit viewport pick: when the hit is a stamped create part under a create-group
 * tree, return the nearest parent group so TransformControls pose the joint.
 * When that group is already in `selectedObjects`, return the mesh (drill-in).
 * Outliner clicks skip this and keep the exact object.
 */
export function resolveJointPickTarget(
  picked: Object3D,
  selectedObjects: readonly Object3D[] = [],
): Object3D {
  if (!readCreatePart(picked)) {
    return picked;
  }

  const group = findNearestCreateGroup(picked);
  if (!group) {
    return picked;
  }

  if (selectedObjects.includes(group)) {
    return picked;
  }

  return group;
}

export type ShiftCreatePartPick =
  | { type: 'toggle'; object: Object3D }
  | { type: 'replace'; from: Object3D; to: Object3D };

/**
 * Shift+click on a stamped create part under a create-group:
 * - first pick toggles the nearest group
 * - second pick (group already selected) replaces the group with the mesh
 * - when the mesh is already selected, toggles the mesh off
 */
export function resolveShiftCreatePartPick(
  picked: Object3D,
  selectedObjects: readonly Object3D[],
): ShiftCreatePartPick {
  if (!readCreatePart(picked)) {
    return { type: 'toggle', object: picked };
  }

  const group = findNearestCreateGroup(picked);
  if (!group) {
    return { type: 'toggle', object: picked };
  }

  if (selectedObjects.includes(picked)) {
    return { type: 'toggle', object: picked };
  }

  if (selectedObjects.includes(group)) {
    return { type: 'replace', from: group, to: picked };
  }

  return { type: 'toggle', object: group };
}
