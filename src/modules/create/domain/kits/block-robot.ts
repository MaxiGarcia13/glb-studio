import type { GroupRecipe, PartRecipe } from '@/modules/create/types/kit';

const IDENTITY_ROTATION = [0, 0, 0] as const;

/** White plating / black structure / cyan face ring (Optimus-style block approx). */
const PLATE = '#f2f2f2';
const FRAME = '#1a1a1a';
const FACE_GLOW = '#3db4ff';

/** Segment sizes tuned toward Mixamo Y Bot (~1.8 m) proportions. */
const FOOT_H = 0.05;
const FOOT_W = 0.11;
const FOOT_D = 0.2;

const SHIN_R = 0.048;
const SHIN_LEN = 0.32;
const SHIN_TOTAL = SHIN_LEN + 2 * SHIN_R;

const KNEE_R = 0.042;

const THIGH_R = 0.058;
const THIGH_LEN = 0.3;
const THIGH_TOTAL = THIGH_LEN + 2 * THIGH_R;

const HIP_H = 0.1;
const HIP_W = 0.3;
const HIP_D = 0.16;

const WAIST_H = 0.08;
const WAIST_W = 0.22;
const WAIST_D = 0.13;

const CHEST_H = 0.34;
const CHEST_W = 0.36;
const CHEST_D = 0.18;

const NECK_H = 0.06;
const NECK_R = 0.04;

const HEAD_R = 0.12;

const FACE_RING_R = 0.095;
const FACE_RING_TUBE = 0.012;

const UPPER_ARM_R = 0.042;
const UPPER_ARM_LEN = 0.2;
const UPPER_ARM_TOTAL = UPPER_ARM_LEN + 2 * UPPER_ARM_R;

const ELBOW_R = 0.038;

const FOREARM_R = 0.038;
const FOREARM_LEN = 0.2;
const FOREARM_TOTAL = FOREARM_LEN + 2 * FOREARM_R;

const HAND_H = 0.09;
const HAND_W = 0.07;
const HAND_D = 0.035;

const LEG_X = 0.09;
const FOOT_Z = FOOT_D / 2 - 0.05;

const yShin = FOOT_H;
const yKnee = yShin + SHIN_TOTAL;
const yThigh = yKnee + 2 * KNEE_R;
const yHip = yThigh + THIGH_TOTAL;
const yWaist = yHip + HIP_H;
const yChest = yWaist + WAIST_H;
const yNeck = yChest + CHEST_H;
const yHead = yNeck + NECK_H;

const headCenterY = yHead + HEAD_R;
const faceRingY = headCenterY - (FACE_RING_R + FACE_RING_TUBE);
const faceRingZ = HEAD_R * 0.75;

const shoulderY = yChest + CHEST_H - 0.04;
const armX = CHEST_W / 2 + UPPER_ARM_R + 0.02;

const yUpperArm = shoulderY - UPPER_ARM_TOTAL;
const yElbow = yUpperArm - ELBOW_R;
const elbowCenterY = yElbow + ELBOW_R;
const yForearm = elbowCenterY - FOREARM_TOTAL;
const yHand = yForearm - HAND_H;

/** Joint pivots (world) — rotating a group swings its children. */
const hipsY = yHip + HIP_H / 2;
const spineY = yWaist + WAIST_H / 2;
const chestY = yChest + CHEST_H / 2;
const neckY = yNeck + NECK_H / 2;
const kneeY = yKnee + KNEE_R;

/**
 * Maintainer-only mesh recipe for offline skinned GLB generation (`npm run kits:block-robot`).
 * Not registered in From kit — users get the skinned kit (`block-robot`).
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
    { name: 'Neck', parent: 'Chest', position: [0, neckY, 0] },
    { name: 'Head', parent: 'Neck', position: [0, headCenterY, 0] },
    { name: 'LeftArm', parent: 'Chest', position: [-armX, shoulderY, 0] },
    { name: 'LeftForeArm', parent: 'LeftArm', position: [-armX, elbowCenterY, 0] },
    { name: 'LeftHand', parent: 'LeftForeArm', position: [-armX, yHand + HAND_H, 0] },
    { name: 'RightArm', parent: 'Chest', position: [armX, shoulderY, 0] },
    { name: 'RightForeArm', parent: 'RightArm', position: [armX, elbowCenterY, 0] },
    { name: 'RightHand', parent: 'RightForeArm', position: [armX, yHand + HAND_H, 0] },
    { name: 'LeftUpLeg', parent: 'Hips', position: [-LEG_X, yHip, 0] },
    { name: 'LeftLeg', parent: 'LeftUpLeg', position: [-LEG_X, kneeY, 0] },
    { name: 'LeftFoot', parent: 'LeftLeg', position: [-LEG_X, 0, 0] },
    { name: 'RightUpLeg', parent: 'Hips', position: [LEG_X, yHip, 0] },
    { name: 'RightLeg', parent: 'RightUpLeg', position: [LEG_X, kneeY, 0] },
    { name: 'RightFoot', parent: 'RightLeg', position: [LEG_X, 0, 0] },
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
      kind: 'capsule',
      name: 'upper_arm_left',
      parent: 'LeftArm',
      position: [-armX, yUpperArm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: UPPER_ARM_R, length: UPPER_ARM_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'elbow_left',
      parent: 'LeftForeArm',
      position: [-armX, yElbow, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ELBOW_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'forearm_left',
      parent: 'LeftForeArm',
      position: [-armX, yForearm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: FOREARM_R, length: FOREARM_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'hand_left',
      parent: 'LeftHand',
      position: [-armX, yHand, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HAND_W, height: HAND_H, depth: HAND_D },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'upper_arm_right',
      parent: 'RightArm',
      position: [armX, yUpperArm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: UPPER_ARM_R, length: UPPER_ARM_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'elbow_right',
      parent: 'RightForeArm',
      position: [armX, yElbow, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ELBOW_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'forearm_right',
      parent: 'RightForeArm',
      position: [armX, yForearm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: FOREARM_R, length: FOREARM_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'hand_right',
      parent: 'RightHand',
      position: [armX, yHand, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HAND_W, height: HAND_H, depth: HAND_D },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'thigh_left',
      parent: 'LeftUpLeg',
      position: [-LEG_X, yThigh, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: THIGH_R, length: THIGH_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'knee_left',
      parent: 'LeftLeg',
      position: [-LEG_X, yKnee, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: KNEE_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'shin_left',
      parent: 'LeftLeg',
      position: [-LEG_X, yShin, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHIN_R, length: SHIN_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'foot_left',
      parent: 'LeftFoot',
      position: [-LEG_X, 0, FOOT_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_W, height: FOOT_H, depth: FOOT_D },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'thigh_right',
      parent: 'RightUpLeg',
      position: [LEG_X, yThigh, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: THIGH_R, length: THIGH_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'knee_right',
      parent: 'RightLeg',
      position: [LEG_X, yKnee, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: KNEE_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'shin_right',
      parent: 'RightLeg',
      position: [LEG_X, yShin, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHIN_R, length: SHIN_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'foot_right',
      parent: 'RightFoot',
      position: [LEG_X, 0, FOOT_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_W, height: FOOT_H, depth: FOOT_D },
      color: FRAME,
    },
  ],
};
