import { Bone, Matrix4, Quaternion, Vector3 } from 'three';

/**
 * Mixamo / Y Bot rest convention: each bone’s local +Y points at its chain
 * continuation so child local position is ~(0, length, 0). US-6 retarget copies
 * source quaternions into that frame — world-axis bind bones break limb motion.
 *
 * Extra local-+Y twist after alignment matches Mixamo body-block secondary axes
 * (arm: +X across / +Z down; foot: +X ≈ −world X so soles stay flat under retarget).
 */
const PRIMARY_CHILD: Readonly<Record<string, string>> = {
  Hips: 'Spine',
  Spine: 'Chest',
  Chest: 'UpperChest',
  UpperChest: 'Neck',
  Neck: 'Head',
  LeftShoulder: 'LeftArm',
  LeftArm: 'LeftForeArm',
  LeftForeArm: 'LeftHand',
  LeftHand: 'LeftHandMiddle1',
  RightShoulder: 'RightArm',
  RightArm: 'RightForeArm',
  RightForeArm: 'RightHand',
  RightHand: 'RightHandMiddle1',
  LeftUpLeg: 'LeftLeg',
  LeftLeg: 'LeftFoot',
  LeftFoot: 'LeftToeBase',
  RightUpLeg: 'RightLeg',
  RightLeg: 'RightFoot',
  RightFoot: 'RightToeBase',
};

/** Extra local-Y twist (rad) after +Y alignment — Mixamo arm/hand/foot bind. */
const MIXAMO_BONE_TWIST_Y: Readonly<Record<string, number>> = {
  LeftShoulder: Math.PI / 2,
  LeftArm: Math.PI / 2,
  LeftForeArm: Math.PI / 2,
  LeftHand: Math.PI / 2,
  RightShoulder: -Math.PI / 2,
  RightArm: -Math.PI / 2,
  RightForeArm: -Math.PI / 2,
  RightHand: -Math.PI / 2,
  /** Flips Foot +X from +world-X to −world-X (body-block bind). */
  LeftFoot: Math.PI,
  RightFoot: Math.PI,
};

const _localY = new Vector3(0, 1, 0);
const _dir = new Vector3();
const _desiredWorldQuat = new Quaternion();
const _twistQuat = new Quaternion();
const _position = new Vector3();
const _childPosition = new Vector3();
const _scale = new Vector3(1, 1, 1);
const _desiredWorld = new Matrix4();
const _parentInverse = new Matrix4();
const _local = new Matrix4();

function primaryChildName(boneName: string): string | null {
  const mapped = PRIMARY_CHILD[boneName];
  if (mapped) {
    return mapped;
  }
  const finger = /^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)([123])$/.exec(
    boneName,
  );
  if (!finger || finger[3] === '3') {
    return null;
  }
  return `${finger[1]}Hand${finger[2]}${Number(finger[3]) + 1}`;
}

function boneDepth(bone: Bone): number {
  let value = 0;
  let cursor: Bone | null = bone;
  while (cursor?.parent instanceof Bone) {
    value += 1;
    cursor = cursor.parent;
  }
  return value;
}

/**
 * Reorient a bind-pose bone hierarchy in place so local +Y follows each chain
 * continuation. Preserves every bone’s world position (and leaf world rotation).
 * Call after parenting bones, before attaching meshes.
 */
export function orientSkeletonMixamoAxes(bones: readonly Bone[]): void {
  if (bones.length === 0) {
    return;
  }

  const byName = new Map<string, Bone>();
  for (const bone of bones) {
    byName.set(bone.name, bone);
  }

  const worldMatrixByBone = new Map<Bone, Matrix4>();
  for (const bone of bones) {
    worldMatrixByBone.set(bone, bone.matrixWorld.clone());
  }

  for (const bone of bones) {
    const snapshot = worldMatrixByBone.get(bone);
    if (!snapshot) {
      continue;
    }
    const childName = primaryChildName(bone.name);
    const child = childName ? byName.get(childName) : undefined;
    const childSnap = child ? worldMatrixByBone.get(child) : undefined;
    if (!child || !childSnap) {
      continue;
    }

    _position.setFromMatrixPosition(snapshot);
    _childPosition.setFromMatrixPosition(childSnap);
    _dir.subVectors(_childPosition, _position);
    if (_dir.lengthSq() < 1e-10) {
      continue;
    }
    _dir.normalize();
    _desiredWorldQuat.setFromUnitVectors(_localY, _dir);
    const twistY = MIXAMO_BONE_TWIST_Y[bone.name];
    if (twistY !== undefined) {
      _twistQuat.setFromAxisAngle(_localY, twistY);
      _desiredWorldQuat.multiply(_twistQuat);
    }
    _desiredWorld.compose(_position, _desiredWorldQuat, _scale);
    worldMatrixByBone.set(bone, _desiredWorld.clone());
  }

  const ordered = [...bones].sort((a, b) => boneDepth(a) - boneDepth(b));
  for (const bone of ordered) {
    const desired = worldMatrixByBone.get(bone);
    if (!desired) {
      continue;
    }
    const parent = bone.parent;
    if (!parent) {
      desired.decompose(bone.position, bone.quaternion, bone.scale);
      bone.updateMatrixWorld(true);
      continue;
    }
    parent.updateMatrixWorld(true);
    _parentInverse.copy(parent.matrixWorld).invert();
    _local.multiplyMatrices(_parentInverse, desired);
    _local.decompose(bone.position, bone.quaternion, bone.scale);
    bone.updateMatrixWorld(true);
  }
}
