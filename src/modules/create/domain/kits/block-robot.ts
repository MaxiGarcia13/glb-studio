import type { GroupRecipe, PartRecipe } from '@/modules/create/types/kit';

import { Euler, Quaternion, Vector3 } from 'three';

const IDENTITY_ROTATION = [0, 0, 0] as const;

/** White plating / black structure / cyan face ring (Optimus-style block approx). */
const PLATE = '#f2f2f2';
const FRAME = '#1a1a1a';
const FACE_GLOW = '#3db4ff';

/** Segment sizes tuned to Mixamo `body-block` local bone lengths (cm÷100) for US-6 retarget. */
const FOOT_H = 0.055;
const FOOT_W = 0.11;
const FOOT_D = 0.2;

const SHIN_R = 0.045;
const SHIN_LEN = 0.279;
const SHIN_TOTAL = SHIN_LEN + 2 * SHIN_R;

const KNEE_R = 0.04;
/**
 * Ankle ball on `*Foot` — ground-origin, so pivot is `footY - ANKLE_R`.
 * Sized to sit in the foot-top / shin-tip junction without piercing the sole.
 */
const ANKLE_R = 0.03;

const THIGH_R = 0.055;
const THIGH_LEN = 0.321;
const THIGH_TOTAL = THIGH_LEN + 2 * THIGH_R;

const HIP_H = 0.09;
const HIP_W = 0.24;
const HIP_D = 0.14;

const WAIST_H = 0.07;
const WAIST_W = 0.18;
const WAIST_D = 0.11;

const CHEST_H = 0.3;
const CHEST_W = 0.3;
const CHEST_D = 0.15;

const NECK_H = 0.05;
const NECK_R = 0.035;

const HEAD_R = 0.11;

const FACE_RING_R = 0.085;
const FACE_RING_TUBE = 0.011;

/** body-block: LeftForeArm local ≈ 0.257 m (upper arm). */
const UPPER_ARM_R = 0.038;
const UPPER_ARM_LEN = 0.181;
const UPPER_ARM_TOTAL = UPPER_ARM_LEN + 2 * UPPER_ARM_R;

const ELBOW_R = 0.034;
/**
 * Shoulder ball on `*Arm` — swings with the upper arm. Center sits between
 * the chest side and the arm root so the mesh bridges the torso (old axle job).
 */
const SHOULDER_R = 0.055;
const HIP_CONNECTOR_R = 0.045;
const HIP_CONNECTOR_H = 0.05;

/** body-block: LeftHand local ≈ 0.223 m (forearm). */
const FOREARM_R = 0.034;
const FOREARM_LEN = 0.155;
const FOREARM_TOTAL = FOREARM_LEN + 2 * FOREARM_R;

/**
 * Palm box after ±90° Z (same as arm capsules):
 * height (`HAND_H`) → along the arm; width (`HAND_W`) → world Y (thickness);
 * depth (`HAND_D`) → world Z (across knuckles). Mixamo T-pose palms face down.
 * body-block: Hand→Middle1 ≈ 0.099 m.
 */
const HAND_H = 0.099;
const HAND_W = 0.026;
const HAND_D = 0.07;

const FINGER_R = 0.008;
const FINGER_THUMB_R = 0.01;
const FINGER_SEG = 0.034;
const THUMB_SEG = 0.035;
const THUMB_DY = 0.006;
const THUMB_DZ = 0.009;

/** body-block: Hips→UpLeg lateral ≈ 0.092 m (local len ≈ 0.109 with slight down). */
const LEG_X = 0.1;
const FOOT_Z = FOOT_D / 2 - 0.04;
/** Ankle mesh slightly forward of the heel so it nests inside the foot block. */
const ANKLE_Z = FOOT_Z * 0.35;

/**
 * Leg chain: sole on y=0, ankle at FOOT_H, then shin/thigh bone lengths.
 * (No extra 2×KNEE_R between shin and thigh — that floated the feet.)
 */
const footY = FOOT_H;
const kneeBoneY = footY + SHIN_TOTAL;
const yHip = kneeBoneY + THIGH_TOTAL;
const yThigh = kneeBoneY;
const yWaist = yHip + HIP_H;
const yChest = yWaist + WAIST_H;
const yNeck = yChest + CHEST_H;
const yHead = yNeck + NECK_H;

const headCenterY = yHead + HEAD_R;
const faceRingY = headCenterY - (FACE_RING_R + FACE_RING_TUBE);
const faceRingZ = HEAD_R * 0.75;

const shoulderY = yChest + CHEST_H - 0.04;
/** body-block / Mixamo: left = +X, right = −X. Shoulder→Arm ≈ 0.150 m. */
const shoulderX = 0.061;
const armX = shoulderX + 0.15;
/** Mid chest-side → arm-root so the ball intersects both. */
const leftShoulderMeshX = (CHEST_W / 2 + armX) / 2;
const rightShoulderMeshX = -leftShoulderMeshX;

/**
 * T-pose: Mixamo left arm along +X, right along −X.
 * Capsules/hands use ±90° Z so capsule local +Y maps along the arm.
 */
const HALF_PI = Math.PI / 2;
const LEFT_ARM_ROTATION = [0, 0, HALF_PI] as const;
const RIGHT_ARM_ROTATION = [0, 0, -HALF_PI] as const;

const leftElbowX = armX + UPPER_ARM_TOTAL;
const leftWristX = leftElbowX + FOREARM_TOTAL;
const leftHandTipX = leftWristX + HAND_H;

const rightElbowX = -armX - UPPER_ARM_TOTAL;
const rightWristX = rightElbowX - FOREARM_TOTAL;
const rightHandTipX = rightWristX - HAND_H;

/** Joint pivots (world) — rotating a group swings its children. */
const hipsY = yHip + HIP_H / 2;
const spineY = yWaist + WAIST_H / 2;
const chestY = yChest + CHEST_H / 2;
const upperChestY = yChest + CHEST_H * 0.78;
const neckY = yNeck + NECK_H / 2;
/** Hip axle sits mostly under the hip box and slightly into the thigh top. */
const hipConnectorY = yHip - HIP_CONNECTOR_H + 0.02;
/**
 * Foot box sole on the ground (`footBoxY = 0` + ground-origin).
 * Ankle bone / sphere center at `footY` (= foot top).
 *
 * Mixamo `body-block` Foot +Y is forward and down (~32°), not flat +Z.
 * US-6 copies Mixamo quaternions into that frame — a horizontal toe made
 * rest-pose foot pitch plant the boxes into the floor. Toe sits on the sole
 * so the helper stays on-grid; pitch matches body-block Δy/Δz.
 */
const footBoxY = 0;
const MIXAMO_FOOT_PITCH_Y = 0.523;
const MIXAMO_FOOT_PITCH_Z = 0.851;
const toeY = 0;
const toeZ = footY * (MIXAMO_FOOT_PITCH_Z / MIXAMO_FOOT_PITCH_Y);

interface FingerChainSpec {
  finger: string;
  y: number;
  z: number;
  base: number;
  radius: number;
  seg: number;
  dy: number;
  dz: number;
}

/**
 * Finger chains from body-block LeftHand locals (cm÷100), mapped to Mixamo T-pose
 * world with left = +X and Hand twist X→−Z / Z→−Y:
 *   worldΔ = (localY, −localZ, −localX)
 * Knuckle `base` is the along-arm component (localY).
 */
function fingerChainSpecs(handY: number): FingerChainSpec[] {
  return [
    {
      finger: 'Thumb',
      y: handY - 0.014,
      z: 0.03,
      base: 0.029,
      radius: FINGER_THUMB_R,
      seg: THUMB_SEG,
      dy: THUMB_DY,
      dz: THUMB_DZ,
    },
    {
      finger: 'Index',
      y: handY,
      z: 0.035,
      base: 0.093,
      radius: FINGER_R,
      seg: FINGER_SEG,
      dy: 0,
      dz: 0,
    },
    {
      finger: 'Middle',
      y: handY,
      z: 0,
      base: HAND_H,
      radius: FINGER_R,
      seg: FINGER_SEG,
      dy: 0,
      dz: 0,
    },
    {
      finger: 'Ring',
      y: handY,
      z: -0.012,
      base: 0.103,
      radius: FINGER_R,
      seg: FINGER_SEG,
      dy: 0,
      dz: 0,
    },
    {
      finger: 'Pinky',
      y: handY,
      z: -0.033,
      base: 0.09,
      radius: FINGER_R,
      seg: FINGER_SEG,
      dy: 0,
      dz: 0,
    },
  ];
}

function fingerGroups(
  side: 'Left' | 'Right',
  handX: number,
  handY: number,
  sign: -1 | 1,
): GroupRecipe[] {
  const hand = `${side}Hand`;
  const groups: GroupRecipe[] = [];
  for (const { finger, y, z, base, seg, dy, dz } of fingerChainSpecs(handY)) {
    for (let i = 1; i <= 3; i += 1) {
      const name = `${side}Hand${finger}${i}`;
      const parent = i === 1 ? hand : `${side}Hand${finger}${i - 1}`;
      const along = i - 1;
      const boneY = y - along * dy;
      const boneZ = z + along * dz;
      const x = handX + sign * (base + along * seg);
      groups.push({ name, parent, position: [x, boneY, boneZ] });
    }
  }
  return groups;
}

/**
 * One rigid capsule per phalanx. Positioned at the distal end of the segment
 * (same convention as upper-arm / forearm capsules). Thumb meshes follow the
 * forward (+Z) fan so both hands share the same thumb direction.
 */
function fingerParts(
  side: 'Left' | 'Right',
  handX: number,
  handY: number,
  sign: -1 | 1,
  rotation: readonly [number, number, number],
): PartRecipe[] {
  const parts: PartRecipe[] = [];
  for (const { finger, y, z, base, radius, seg, dy, dz } of fingerChainSpecs(handY)) {
    for (let i = 1; i <= 3; i += 1) {
      const bone = `${side}Hand${finger}${i}`;
      const thumbFan = finger === 'Thumb';
      const proximalAlong = i - 1;
      const distalAlong = i;
      const proximalY = y - proximalAlong * dy;
      const proximalZ = z + proximalAlong * dz;
      const distalY = y - distalAlong * dy;
      const distalZ = z + distalAlong * dz;
      const proximalX = handX + sign * (base + proximalAlong * seg);
      const distalX = handX + sign * (base + distalAlong * seg);
      const spacing = Math.hypot(
        distalX - proximalX,
        distalY - proximalY,
        distalZ - proximalZ,
      );
      const length = Math.max(0.004, spacing - 2 * radius + 0.002);
      const meshRotation: [number, number, number] = thumbFan
        ? rotationAligningLocalYTo(
            proximalX - distalX,
            proximalY - distalY,
            proximalZ - distalZ,
          )
        : [rotation[0], rotation[1], rotation[2]];
      parts.push({
        kind: 'capsule',
        name: `${side.toLowerCase()}_finger_${finger.toLowerCase()}_${i}`,
        parent: bone,
        position: [distalX, distalY, distalZ],
        rotation: meshRotation,
        params: { radius, length },
        color: FRAME,
      });
    }
  }
  return parts;
}

const _alignY = new Vector3(0, 1, 0);
const _alignDir = new Vector3();
const _alignQuat = new Quaternion();
const _alignEuler = new Euler();

/** Euler XYZ that maps capsule local +Y onto the given world direction. */
function rotationAligningLocalYTo(
  dx: number,
  dy: number,
  dz: number,
): [number, number, number] {
  _alignDir.set(dx, dy, dz).normalize();
  _alignQuat.setFromUnitVectors(_alignY, _alignDir);
  _alignEuler.setFromQuaternion(_alignQuat, 'XYZ');
  return [_alignEuler.x, _alignEuler.y, _alignEuler.z];
}

/**
 * Maintainer-only mesh recipe for offline skinned GLB generation (`npm run kits:block-robot`).
 * Bind pose is a T-pose (arms along ±X). Not registered in From kit — users get the skinned kit.
 * Skeleton matches Mixamo Y Bot bone count (52) and unprefixed local names for retarget.
 */
export interface BlockRobotMeshRecipe {
  label: string;
  groups: readonly GroupRecipe[];
  parts: readonly PartRecipe[];
}

export const BLOCK_ROBOT_MESH_RECIPE: BlockRobotMeshRecipe = {
  label: 'Block robot',
  groups: [
    { name: 'Armature', position: [0, 0, 0] },
    { name: 'Hips', parent: 'Armature', position: [0, hipsY, 0] },
    { name: 'Spine', parent: 'Hips', position: [0, spineY, 0] },
    { name: 'Chest', parent: 'Spine', position: [0, chestY, 0] },
    { name: 'UpperChest', parent: 'Chest', position: [0, upperChestY, 0] },
    { name: 'Neck', parent: 'UpperChest', position: [0, neckY, 0] },
    { name: 'Head', parent: 'Neck', position: [0, headCenterY, 0] },
    { name: 'LeftShoulder', parent: 'UpperChest', position: [shoulderX, shoulderY, 0] },
    { name: 'LeftArm', parent: 'LeftShoulder', position: [armX, shoulderY, 0] },
    { name: 'LeftForeArm', parent: 'LeftArm', position: [leftElbowX, shoulderY, 0] },
    { name: 'LeftHand', parent: 'LeftForeArm', position: [leftWristX, shoulderY, 0] },
    ...fingerGroups('Left', leftWristX, shoulderY, 1),
    { name: 'RightShoulder', parent: 'UpperChest', position: [-shoulderX, shoulderY, 0] },
    { name: 'RightArm', parent: 'RightShoulder', position: [-armX, shoulderY, 0] },
    { name: 'RightForeArm', parent: 'RightArm', position: [rightElbowX, shoulderY, 0] },
    { name: 'RightHand', parent: 'RightForeArm', position: [rightWristX, shoulderY, 0] },
    ...fingerGroups('Right', rightWristX, shoulderY, -1),
    { name: 'LeftUpLeg', parent: 'Hips', position: [LEG_X, yHip, 0] },
    { name: 'LeftLeg', parent: 'LeftUpLeg', position: [LEG_X, kneeBoneY, 0] },
    { name: 'LeftFoot', parent: 'LeftLeg', position: [LEG_X, footY, 0] },
    { name: 'LeftToeBase', parent: 'LeftFoot', position: [LEG_X, toeY, toeZ] },
    { name: 'RightUpLeg', parent: 'Hips', position: [-LEG_X, yHip, 0] },
    { name: 'RightLeg', parent: 'RightUpLeg', position: [-LEG_X, kneeBoneY, 0] },
    { name: 'RightFoot', parent: 'RightLeg', position: [-LEG_X, footY, 0] },
    { name: 'RightToeBase', parent: 'RightFoot', position: [-LEG_X, toeY, toeZ] },
  ],
  parts: [
    {
      kind: 'box',
      name: 'hip',
      parent: 'Hips',
      position: [0, yHip, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HIP_W, height: HIP_H, depth: HIP_D },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'waist',
      parent: 'Spine',
      position: [0, yWaist, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: WAIST_W, height: WAIST_H, depth: WAIST_D },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'chest',
      parent: 'Chest',
      position: [0, yChest, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: CHEST_W, height: CHEST_H, depth: CHEST_D },
      color: PLATE,
    },
    {
      kind: 'cylinder',
      name: 'neck',
      parent: 'Neck',
      position: [0, yNeck, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: NECK_R, height: NECK_H },
      color: FRAME,
    },
    {
      kind: 'sphere',
      name: 'head',
      parent: 'Head',
      position: [0, yHead, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: HEAD_R },
      color: FRAME,
    },
    {
      kind: 'torus',
      name: 'face_ring',
      parent: 'Head',
      position: [0, faceRingY, faceRingZ],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: FACE_RING_R, tube: FACE_RING_TUBE },
      color: FACE_GLOW,
    },
    {
      kind: 'sphere',
      name: 'shoulder_left',
      parent: 'LeftArm',
      position: [leftShoulderMeshX, shoulderY - SHOULDER_R, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHOULDER_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'upper_arm_left',
      parent: 'LeftArm',
      position: [leftElbowX, shoulderY, 0],
      rotation: [...LEFT_ARM_ROTATION],
      params: { radius: UPPER_ARM_R, length: UPPER_ARM_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'elbow_left',
      parent: 'LeftForeArm',
      position: [leftElbowX, shoulderY - ELBOW_R, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ELBOW_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'forearm_left',
      parent: 'LeftForeArm',
      position: [leftWristX, shoulderY, 0],
      rotation: [...LEFT_ARM_ROTATION],
      params: { radius: FOREARM_R, length: FOREARM_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'hand_left',
      parent: 'LeftHand',
      position: [leftHandTipX, shoulderY, 0],
      rotation: [...LEFT_ARM_ROTATION],
      params: { width: HAND_W, height: HAND_H, depth: HAND_D },
      color: FRAME,
    },
    ...fingerParts('Left', leftWristX, shoulderY, 1, LEFT_ARM_ROTATION),
    {
      kind: 'sphere',
      name: 'shoulder_right',
      parent: 'RightArm',
      position: [rightShoulderMeshX, shoulderY - SHOULDER_R, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHOULDER_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'upper_arm_right',
      parent: 'RightArm',
      position: [rightElbowX, shoulderY, 0],
      rotation: [...RIGHT_ARM_ROTATION],
      params: { radius: UPPER_ARM_R, length: UPPER_ARM_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'elbow_right',
      parent: 'RightForeArm',
      position: [rightElbowX, shoulderY - ELBOW_R, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ELBOW_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'forearm_right',
      parent: 'RightForeArm',
      position: [rightWristX, shoulderY, 0],
      rotation: [...RIGHT_ARM_ROTATION],
      params: { radius: FOREARM_R, length: FOREARM_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'hand_right',
      parent: 'RightHand',
      position: [rightHandTipX, shoulderY, 0],
      rotation: [...RIGHT_ARM_ROTATION],
      params: { width: HAND_W, height: HAND_H, depth: HAND_D },
      color: FRAME,
    },
    ...fingerParts('Right', rightWristX, shoulderY, -1, RIGHT_ARM_ROTATION),
    {
      kind: 'cylinder',
      name: 'hip_left',
      parent: 'LeftUpLeg',
      position: [LEG_X, hipConnectorY, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: HIP_CONNECTOR_R, height: HIP_CONNECTOR_H },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'thigh_left',
      parent: 'LeftUpLeg',
      position: [LEG_X, yThigh, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: THIGH_R, length: THIGH_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'knee_left',
      parent: 'LeftLeg',
      position: [LEG_X, kneeBoneY - KNEE_R, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: KNEE_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'shin_left',
      parent: 'LeftLeg',
      position: [LEG_X, footY, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHIN_R, length: SHIN_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'ankle_left',
      parent: 'LeftFoot',
      position: [LEG_X, footY - ANKLE_R, ANKLE_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ANKLE_R },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'foot_left',
      parent: 'LeftFoot',
      position: [LEG_X, footBoxY, FOOT_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_W, height: FOOT_H, depth: FOOT_D },
      color: FRAME,
    },
    {
      kind: 'cylinder',
      name: 'hip_right',
      parent: 'RightUpLeg',
      position: [-LEG_X, hipConnectorY, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: HIP_CONNECTOR_R, height: HIP_CONNECTOR_H },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'thigh_right',
      parent: 'RightUpLeg',
      position: [-LEG_X, yThigh, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: THIGH_R, length: THIGH_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'knee_right',
      parent: 'RightLeg',
      position: [-LEG_X, kneeBoneY - KNEE_R, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: KNEE_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'shin_right',
      parent: 'RightLeg',
      position: [-LEG_X, footY, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHIN_R, length: SHIN_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'ankle_right',
      parent: 'RightFoot',
      position: [-LEG_X, footY - ANKLE_R, ANKLE_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ANKLE_R },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'foot_right',
      parent: 'RightFoot',
      position: [-LEG_X, footBoxY, FOOT_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_W, height: FOOT_H, depth: FOOT_D },
      color: FRAME,
    },
  ],
};
