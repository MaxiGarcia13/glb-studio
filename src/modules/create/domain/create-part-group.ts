import type { Object3D } from 'three';
import { Group } from 'three';
import { isCreateGroup, writeCreateGroup } from './group-data';
import { nextObjectName } from './object-name';

/**
 * Create a stamped empty group under `partsRoot` with a unique `group` name.
 * World transform is identity at the root (children keep world pose via attach).
 */
export function createEmptyPartGroup(partsRoot: Object3D): Group {
  const group = new Group();
  group.name = nextObjectName(partsRoot, 'group');
  writeCreateGroup(group);
  partsRoot.add(group);
  return group;
}

/** Remove an empty create group from the graph (does not dispose children). */
export function removeEmptyPartGroup(group: Object3D): void {
  if (!isCreateGroup(group)) {
    return;
  }
  group.removeFromParent();
}
