import type { Object3D } from 'three';
import { readCreatePart } from './part-data';

/** Empty group / joint node `userData` key (no mesh). */
export const CREATE_GROUP_USER_DATA_KEY = 'createGroup';

export type CreateGroupKind = 'group' | 'joint';

export interface CreateGroupUserData {
  kind: CreateGroupKind;
}

export function readCreateGroup(object: Object3D): CreateGroupUserData | null {
  const raw = object.userData[CREATE_GROUP_USER_DATA_KEY];
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const { kind } = raw as { kind?: unknown };
  if (kind !== 'group' && kind !== 'joint') {
    return null;
  }
  return { kind };
}

/** Organizational create group (not a skeleton bone). */
export function writeCreateGroup(object: Object3D): void {
  object.userData[CREATE_GROUP_USER_DATA_KEY] = { kind: 'group' } satisfies CreateGroupUserData;
}

/** Skeleton joint create group (becomes a Bone on Skin). */
export function writeCreateJoint(object: Object3D): void {
  object.userData[CREATE_GROUP_USER_DATA_KEY] = { kind: 'joint' } satisfies CreateGroupUserData;
}

/** True for either a plain group or a joint stamp. */
export function isCreateGroup(object: Object3D): boolean {
  return readCreateGroup(object) !== null;
}

export function isCreateJoint(object: Object3D): boolean {
  return readCreateGroup(object)?.kind === 'joint';
}

export function isCreatePlainGroup(object: Object3D): boolean {
  return readCreateGroup(object)?.kind === 'group';
}

/** True when the node is a stamped create part mesh or an empty create group/joint. */
export function isCreateHierarchyNode(object: Object3D): boolean {
  if (isCreateGroup(object)) {
    return true;
  }
  const mesh = object as { isMesh?: boolean };
  return Boolean(mesh.isMesh && readCreatePart(object));
}
