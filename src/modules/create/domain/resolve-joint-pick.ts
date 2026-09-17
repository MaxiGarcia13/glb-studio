import type { Object3D } from 'three';
import { isCreateGroup } from './group-data';
import { readCreatePart } from './part-data';

/**
 * Edit viewport pick: when the hit is a stamped create part under a create-group
 * tree, return the nearest parent group so TransformControls pose the joint.
 * Outliner clicks and Shift+click bypass skip this and keep the exact mesh.
 */
export function resolveJointPickTarget(picked: Object3D): Object3D {
  if (!readCreatePart(picked)) {
    return picked;
  }

  let current: Object3D | null = picked.parent;
  while (current) {
    if (isCreateGroup(current)) {
      return current;
    }
    current = current.parent;
  }

  return picked;
}
