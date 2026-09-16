import type { Object3D } from 'three';
import { readCreatePart } from './part-data';

/** Empty group node `userData` key (no mesh). */
export const CREATE_GROUP_USER_DATA_KEY = 'createGroup';

export interface CreateGroupUserData {
  kind: 'group';
}

export function readCreateGroup(object: Object3D): CreateGroupUserData | null {
  const raw = object.userData[CREATE_GROUP_USER_DATA_KEY];
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const { kind } = raw as { kind?: unknown };
  if (kind !== 'group') {
    return null;
  }
  return { kind: 'group' };
}

export function writeCreateGroup(object: Object3D): void {
  object.userData[CREATE_GROUP_USER_DATA_KEY] = { kind: 'group' };
}

export function isCreateGroup(object: Object3D): boolean {
  return readCreateGroup(object) !== null;
}

/** True when the node is a stamped create part mesh or an empty create group. */
export function isCreateHierarchyNode(object: Object3D): boolean {
  if (isCreateGroup(object)) {
    return true;
  }
  const mesh = object as { isMesh?: boolean };
  return Boolean(mesh.isMesh && readCreatePart(object));
}
