import type { Kit } from '@/modules/create/types/kit';

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

/**
 * Slender humanoid robot — Y Bot–ish segments, white/black/cyan plating.
 * Primitives only (no skinning). From kit flow; New model stays empty.
 */
export const BLOCK_ROBOT_KIT: Kit<'block-robot'> = {
  id: 'block-robot',
  label: 'Block robot',
  description: 'A slender white-and-black humanoid you can recolour and rearrange.',
  parts: [
    {
      kind: 'box',
      name: 'foot_left',
      position: [-LEG_X, 0, FOOT_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_W, height: FOOT_H, depth: FOOT_D },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'foot_right',
      position: [LEG_X, 0, FOOT_Z],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_W, height: FOOT_H, depth: FOOT_D },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'shin_left',
      position: [-LEG_X, yShin, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHIN_R, length: SHIN_LEN },
      color: PLATE,
    },
    {
      kind: 'capsule',
      name: 'shin_right',
      position: [LEG_X, yShin, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: SHIN_R, length: SHIN_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'knee_left',
      position: [-LEG_X, yKnee, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: KNEE_R },
      color: FRAME,
    },
    {
      kind: 'sphere',
      name: 'knee_right',
      position: [LEG_X, yKnee, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: KNEE_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'thigh_left',
      position: [-LEG_X, yThigh, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: THIGH_R, length: THIGH_LEN },
      color: PLATE,
    },
    {
      kind: 'capsule',
      name: 'thigh_right',
      position: [LEG_X, yThigh, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: THIGH_R, length: THIGH_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'hip',
      position: [0, yHip, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HIP_W, height: HIP_H, depth: HIP_D },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'waist',
      position: [0, yWaist, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: WAIST_W, height: WAIST_H, depth: WAIST_D },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'chest',
      position: [0, yChest, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: CHEST_W, height: CHEST_H, depth: CHEST_D },
      color: PLATE,
    },
    {
      kind: 'cylinder',
      name: 'neck',
      position: [0, yNeck, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: NECK_R, height: NECK_H },
      color: FRAME,
    },
    {
      kind: 'sphere',
      name: 'head',
      position: [0, yHead, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: HEAD_R },
      color: FRAME,
    },
    {
      kind: 'torus',
      name: 'face_ring',
      position: [0, faceRingY, faceRingZ],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: FACE_RING_R, tube: FACE_RING_TUBE },
      color: FACE_GLOW,
    },
    {
      kind: 'capsule',
      name: 'upper_arm_left',
      position: [-armX, yUpperArm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: UPPER_ARM_R, length: UPPER_ARM_LEN },
      color: PLATE,
    },
    {
      kind: 'capsule',
      name: 'upper_arm_right',
      position: [armX, yUpperArm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: UPPER_ARM_R, length: UPPER_ARM_LEN },
      color: PLATE,
    },
    {
      kind: 'sphere',
      name: 'elbow_left',
      position: [-armX, yElbow, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ELBOW_R },
      color: FRAME,
    },
    {
      kind: 'sphere',
      name: 'elbow_right',
      position: [armX, yElbow, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: ELBOW_R },
      color: FRAME,
    },
    {
      kind: 'capsule',
      name: 'forearm_left',
      position: [-armX, yForearm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: FOREARM_R, length: FOREARM_LEN },
      color: PLATE,
    },
    {
      kind: 'capsule',
      name: 'forearm_right',
      position: [armX, yForearm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: FOREARM_R, length: FOREARM_LEN },
      color: PLATE,
    },
    {
      kind: 'box',
      name: 'hand_left',
      position: [-armX, yHand, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HAND_W, height: HAND_H, depth: HAND_D },
      color: FRAME,
    },
    {
      kind: 'box',
      name: 'hand_right',
      position: [armX, yHand, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HAND_W, height: HAND_H, depth: HAND_D },
      color: FRAME,
    },
  ],
};
