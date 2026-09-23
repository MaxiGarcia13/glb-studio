import type { Object3D } from 'three';
import { Bone, Group } from 'three';

import { ARMATURE_GROUP_NAME } from '@/modules/create/constants/armature';

import { isCreateGroup, isCreateJoint } from '../hierarchy/group-data';
import { listCreatedPartEntries } from '../list-created-parts';

export { ARMATURE_GROUP_NAME };

export interface CreateGroupBoneTree {
  /** Skeleton bones in joint pre-order (excludes Armature). */
  bones: Bone[];
  /**
   * Present when a create joint/group is named `Armature`.
   * Root bones are parented under it; not included in `bones`.
   */
  armature: Group | null;
  /** Source joint → Bone or Armature Group. */
  groupToNode: Map<Object3D, Bone | Group>;
}

/**
 * Whether this create node participates in the skin armature.
 * Joints become bones; a node named `Armature` is the non-bone container
 * (kit stamp is usually a joint with that name).
 */
export function isSkinArmatureNode(object: Object3D): boolean {
  if (object.name === ARMATURE_GROUP_NAME && isCreateGroup(object)) {
    return true;
  }
  return isCreateJoint(object);
}

/**
 * Build a Bone hierarchy from **joints** (plain create groups are skipped).
 * Copies world transforms at call time (bind pose). Does not mutate `scene`.
 */
export function buildBonesFromCreateGroups(scene: Object3D): CreateGroupBoneTree {
  const groups = listCreatedPartEntries(scene)
    .filter((entry) => entry.isGroup && isSkinArmatureNode(entry.object))
    .map((entry) => entry.object);

  if (groups.length === 0) {
    throw new Error('No joints to turn into bones');
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
    throw new Error('No bones produced — add joints other than Armature');
  }

  staging.updateMatrixWorld(true);

  for (const group of groups) {
    const node = groupToNode.get(group);
    if (!node || node === armature) {
      continue;
    }

    const parentGroup = findSkinArmatureAncestor(group, groupSet, scene);
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

function findSkinArmatureAncestor(
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
