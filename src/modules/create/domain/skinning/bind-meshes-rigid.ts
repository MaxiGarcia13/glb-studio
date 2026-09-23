import type { BufferGeometry, Mesh, Object3D, Skeleton } from 'three';
import {
  Bone,
  Float32BufferAttribute,
  SkinnedMesh,
  Uint16BufferAttribute,
} from 'three';

import { ARMATURE_GROUP_NAME } from '@/modules/create/constants/armature';

import { isCreateJoint } from '../hierarchy/group-data';
import { listCreatedParts } from '../list-created-parts';

export interface BindMeshesRigidResult {
  skinnedMeshes: SkinnedMesh[];
  /** Parts with no resolvable parent bone (should be rare after canSkin). */
  skippedCount: number;
}

/**
 * Convert stamped create parts into rigid SkinnedMeshes (weight 1 → parent bone).
 * Geometry is baked to world space at identity; bind pose uses current bone matrices.
 * Does not mutate `scene` — caller replaces meshes on success.
 */
export function bindMeshesRigid(
  scene: Object3D,
  skeleton: Skeleton,
): BindMeshesRigidResult {
  if (skeleton.bones.length === 0) {
    throw new Error('Skeleton has no bones');
  }

  scene.updateMatrixWorld(true);
  updateSkeletonWorldMatrices(skeleton);

  const rootIndex = findRootBoneIndex(skeleton);
  const skinnedMeshes: SkinnedMesh[] = [];
  let skippedCount = 0;

  for (const mesh of listCreatedParts(scene)) {
    const boneIndex = resolveParentBoneIndex(mesh, skeleton, rootIndex);
    if (boneIndex === null) {
      skippedCount += 1;
      continue;
    }
    skinnedMeshes.push(meshToRigidSkinned(mesh, skeleton, boneIndex));
  }

  skeleton.calculateInverses();
  return { skinnedMeshes, skippedCount };
}

function resolveParentBoneIndex(
  mesh: Mesh,
  skeleton: Skeleton,
  rootIndex: number,
): number | null {
  const group = findNearestCreateJoint(mesh);
  if (!group || group.name === ARMATURE_GROUP_NAME) {
    return rootIndex;
  }

  const index = skeleton.bones.findIndex((bone) => bone.name === group.name);
  return index >= 0 ? index : null;
}

function findNearestCreateJoint(mesh: Object3D): Object3D | null {
  let current: Object3D | null = mesh.parent;
  while (current) {
    if (isCreateJoint(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function findRootBoneIndex(skeleton: Skeleton): number {
  const boneSet = new Set(skeleton.bones);
  for (let i = 0; i < skeleton.bones.length; i += 1) {
    const bone = skeleton.bones[i]!;
    if (!(bone.parent instanceof Bone) || !boneSet.has(bone.parent)) {
      return i;
    }
  }
  return 0;
}

function updateSkeletonWorldMatrices(skeleton: Skeleton): void {
  const boneSet = new Set(skeleton.bones);
  const roots = new Set<Object3D>();

  for (const bone of skeleton.bones) {
    let top: Object3D = bone;
    while (
      top.parent
      && (boneSet.has(top.parent as Bone) || top.parent.name === ARMATURE_GROUP_NAME)
    ) {
      top = top.parent;
    }
    roots.add(top);
  }

  for (const root of roots) {
    root.updateWorldMatrix(true, true);
  }
}

function meshToRigidSkinned(
  mesh: Mesh,
  skeleton: Skeleton,
  boneIndex: number,
): SkinnedMesh {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  addRigidSkinAttributes(geometry, boneIndex);

  const material = Array.isArray(mesh.material)
    ? mesh.material.map((entry) => entry.clone())
    : mesh.material.clone();

  const skinned = new SkinnedMesh(geometry, material);
  skinned.name = mesh.name;
  skinned.bind(skeleton);
  return skinned;
}

function addRigidSkinAttributes(geometry: BufferGeometry, boneIndex: number): void {
  const count = geometry.getAttribute('position').count;
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    skinIndices[offset] = boneIndex;
    skinWeights[offset] = 1;
  }
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));
}
