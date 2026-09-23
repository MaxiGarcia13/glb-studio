import { ARMATURE_GROUP_NAME } from './armature';

/**
 * Unprefixed Mixamo-style joint names for **Make joint** suggestions.
 * Matches the Block robot / kits README contract (no `mixamorig` prefix).
 */
export const SUGGESTED_JOINT_NAMES = [
  ARMATURE_GROUP_NAME,
  'Hips',
  'Spine',
  'Chest',
  'UpperChest',
  'Neck',
  'Head',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
] as const;

export type SuggestedJointName = (typeof SUGGESTED_JOINT_NAMES)[number];
