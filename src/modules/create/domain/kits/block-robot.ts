import type { Kit } from '@/modules/create/types/kit';

const IDENTITY_ROTATION = [0, 0, 0] as const;

const FOOT_HEIGHT = 0.08;
const LEG_HEIGHT = 0.62;
const HIP_HEIGHT = 0.16;
const TORSO_HEIGHT = 0.48;
const HEAD_SIZE = 0.3;
const ARM_HEIGHT = 0.52;
const ARM_SIZE = 0.12;
const HAND_HEIGHT = 0.1;
const ANTENNA_HEIGHT = 0.18;
const ANTENNA_TIP_HEIGHT = 0.08;

const TORSO_WIDTH = 0.4;
const TORSO_DEPTH = 0.22;
const HIP_WIDTH = 0.36;
const HIP_DEPTH = 0.2;
const LEG_WIDTH = 0.16;
const LEG_DEPTH = 0.16;
const FOOT_WIDTH = 0.18;
const FOOT_DEPTH = 0.26;
const VISOR_HEIGHT = 0.1;
const VISOR_DEPTH = 0.04;

const yLeg = FOOT_HEIGHT;
const yHip = yLeg + LEG_HEIGHT;
const yTorso = yHip + HIP_HEIGHT;
const yHead = yTorso + TORSO_HEIGHT;
const yAntenna = yHead + HEAD_SIZE;
const yAntennaTip = yAntenna + ANTENNA_HEIGHT;
const yArm = yHead - 0.04 - ARM_HEIGHT;
const yHand = yArm - HAND_HEIGHT;

const armX = TORSO_WIDTH / 2 + ARM_SIZE / 2;
const legX = LEG_WIDTH / 2 + 0.02;
const footZ = FOOT_DEPTH / 2 - LEG_DEPTH / 2;
const visorZ = HEAD_SIZE / 2 + VISOR_DEPTH / 2;
const visorY = yHead + (HEAD_SIZE - VISOR_HEIGHT) / 2;

const BODY_COLOR = '#7d868e';
const LIMB_COLOR = '#9aa3ab';
const HEAD_COLOR = '#c5ccd3';
const FOOT_COLOR = '#5c636a';
const VISOR_COLOR = '#2b8aad';
const ACCENT_COLOR = '#d97706';

/**
 * Block humanoid/robot from existing kinds — metres, grounded, named for overlay.
 * Instantiate in the From kit flow (US-27); New model stays empty.
 */
export const BLOCK_ROBOT_KIT: Kit<'block-robot'> = {
  id: 'block-robot',
  label: 'Block robot',
  description: 'A blocky standing robot you can recolour and rearrange.',
  parts: [
    {
      kind: 'box',
      name: 'foot_left',
      position: [-legX, 0, footZ],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_WIDTH, height: FOOT_HEIGHT, depth: FOOT_DEPTH },
      color: FOOT_COLOR,
    },
    {
      kind: 'box',
      name: 'foot_right',
      position: [legX, 0, footZ],
      rotation: [...IDENTITY_ROTATION],
      params: { width: FOOT_WIDTH, height: FOOT_HEIGHT, depth: FOOT_DEPTH },
      color: FOOT_COLOR,
    },
    {
      kind: 'box',
      name: 'leg_left',
      position: [-legX, yLeg, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: LEG_WIDTH, height: LEG_HEIGHT, depth: LEG_DEPTH },
      color: LIMB_COLOR,
    },
    {
      kind: 'box',
      name: 'leg_right',
      position: [legX, yLeg, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: LEG_WIDTH, height: LEG_HEIGHT, depth: LEG_DEPTH },
      color: LIMB_COLOR,
    },
    {
      kind: 'box',
      name: 'hip',
      position: [0, yHip, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HIP_WIDTH, height: HIP_HEIGHT, depth: HIP_DEPTH },
      color: BODY_COLOR,
    },
    {
      kind: 'box',
      name: 'torso',
      position: [0, yTorso, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: TORSO_WIDTH, height: TORSO_HEIGHT, depth: TORSO_DEPTH },
      color: BODY_COLOR,
    },
    {
      kind: 'box',
      name: 'arm_left',
      position: [-armX, yArm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: ARM_SIZE, height: ARM_HEIGHT, depth: ARM_SIZE },
      color: LIMB_COLOR,
    },
    {
      kind: 'box',
      name: 'arm_right',
      position: [armX, yArm, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: ARM_SIZE, height: ARM_HEIGHT, depth: ARM_SIZE },
      color: LIMB_COLOR,
    },
    {
      kind: 'box',
      name: 'hand_left',
      position: [-armX, yHand, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: ARM_SIZE, height: HAND_HEIGHT, depth: ARM_SIZE },
      color: FOOT_COLOR,
    },
    {
      kind: 'box',
      name: 'hand_right',
      position: [armX, yHand, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: ARM_SIZE, height: HAND_HEIGHT, depth: ARM_SIZE },
      color: FOOT_COLOR,
    },
    {
      kind: 'box',
      name: 'head',
      position: [0, yHead, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { width: HEAD_SIZE, height: HEAD_SIZE, depth: HEAD_SIZE },
      color: HEAD_COLOR,
    },
    {
      kind: 'box',
      name: 'visor',
      position: [0, visorY, visorZ],
      rotation: [...IDENTITY_ROTATION],
      params: { width: 0.22, height: VISOR_HEIGHT, depth: VISOR_DEPTH },
      color: VISOR_COLOR,
    },
    {
      kind: 'cylinder',
      name: 'antenna',
      position: [0.08, yAntenna, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: 0.02, height: ANTENNA_HEIGHT },
      color: ACCENT_COLOR,
    },
    {
      kind: 'cone',
      name: 'antenna_tip',
      position: [0.08, yAntennaTip, 0],
      rotation: [...IDENTITY_ROTATION],
      params: { radius: 0.04, height: ANTENNA_TIP_HEIGHT },
      color: ACCENT_COLOR,
    },
  ],
};
