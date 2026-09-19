import type { Object3D } from 'three';
import { Bone, Group } from 'three';

import { listCreatedPartEntries } from '../list-created-parts';

/** Matches offline kit skinning — container, not a Skeleton bone. */
export const ARMATURE_GROUP_NAME = 'Armature';

export interface CreateGroupBoneTree {
  /** Skeleton bones in create-group pre-order (excludes Armature). */
  bones: Bone[];
  /**
   * Present when a create group is named `Armature`.
   * Root bones are parented under it; not included in `bones`.
   */
  armature: Group | null;
  /** Source create group → Bone or Armature Group. */
  groupToNode: Map<Object3D, Bone | Group>;
}

/**
 * Build a Bone hierarchy that mirrors create-group names and parenting.
 * Copies world transforms at call time (bind pose). Does not mutate `scene`.
 */
export function buildBonesFromCreateGroups(scene: Object3D): CreateGroupBoneTree {
  const groups = listCreatedPartEntries(scene)
    .filter((entry) => entry.isGroup)
    .map((entry) => entry.object);

  if (groups.length === 0) {
    throw new Error('No create groups to turn into bones');
  }

  scene.updateMatrixWorld(true);

  const groupSet = new Set(groups);
  const groupToNode = new Map<Object3D, Bone | Group>();
  const bones: Bone[] = [];
  let armature: Group | null = null;

  const staging = new Group();

  for (const group of groups) {
    if (group.name === ARMATURE_GROUP_NAME) {
      if (armature) {
        throw new Error('Multiple Armature create groups are not supported');
      }
      const node = new Group();
      node.name = ARMATURE_GROUP_NAME;
      copyWorldTransform(group, node);
      staging.add(node);
      armature = node;
      groupToNode.set(group, node);
      continue;
    }

    const bone = new Bone();
    bone.name = group.name;
    copyWorldTransform(group, bone);
    staging.add(bone);
    bones.push(bone);
    groupToNode.set(group, bone);
  }

  if (bones.length === 0) {
    throw new Error('No bones produced — add create groups other than Armature');
  }

  staging.updateMatrixWorld(true);

  for (const group of groups) {
    const node = groupToNode.get(group);
    if (!node || node === armature) {
      continue;
    }

    const parentGroup = findCreateGroupAncestor(group, groupSet, scene);
    if (parentGroup) {
      const parentNode = groupToNode.get(parentGroup);
      if (parentNode) {
        parentNode.attach(node);
        continue;
      }
    }

    if (armature) {
      armature.attach(node);
    }
  }

  for (const child of [...staging.children]) {
    child.removeFromParent();
  }

  return { bones, armature, groupToNode };
}

function findCreateGroupAncestor(
  group: Object3D,
  groupSet: Set<Object3D>,
  partsRoot: Object3D,
): Object3D | null {
  let current: Object3D | null = group.parent;
  while (current && current !== partsRoot) {
    if (groupSet.has(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function copyWorldTransform(source: Object3D, target: Object3D): void {
  target.matrix.copy(source.matrixWorld);
  target.matrix.decompose(target.position, target.quaternion, target.scale);
}
