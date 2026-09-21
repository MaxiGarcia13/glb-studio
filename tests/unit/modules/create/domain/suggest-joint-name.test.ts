import { describe, expect, it } from 'vitest';

import {
  normalizePartNameToken,
  suggestJointNameFromPartNames,
} from '@/modules/create/domain/suggest-joint-name';

describe('normalizePartNameToken', () => {
  it('lowercases and collapses separators', () => {
    expect(normalizePartNameToken('Ankle_Right')).toBe('ankle_right');
    expect(normalizePartNameToken('RightFoot')).toBe('right_foot');
  });
});

describe('suggestJointNameFromPartNames', () => {
  it('maps ankle_right + foot to RightFoot', () => {
    expect(suggestJointNameFromPartNames(['ankle_right', 'foot'])).toBe('RightFoot');
  });

  it('maps left hand parts to LeftHand', () => {
    expect(suggestJointNameFromPartNames(['hand_left', 'palm'])).toBe('LeftHand');
  });

  it('maps hip/pelvis names to Hips', () => {
    expect(suggestJointNameFromPartNames(['pelvis', 'hips_mesh'])).toBe('Hips');
  });

  it('maps a limb hip socket to UpLeg, not Hips', () => {
    expect(suggestJointNameFromPartNames(['hip_right'])).toBe('RightUpLeg');
  });

  it('maps knee_right to RightLeg', () => {
    expect(suggestJointNameFromPartNames(['knee_right'])).toBe('RightLeg');
  });

  it('returns an exact suggested name when a part is already named that way', () => {
    expect(suggestJointNameFromPartNames(['RightFoot'])).toBe('RightFoot');
  });

  it('returns null when the body part is unclear', () => {
    expect(suggestJointNameFromPartNames(['box', 'sphere'])).toBeNull();
  });

  it('returns null for a sided limb with no left/right cue', () => {
    expect(suggestJointNameFromPartNames(['foot', 'ankle'])).toBeNull();
  });

  it('prefers toe over foot when both appear', () => {
    expect(suggestJointNameFromPartNames(['right_foot', 'toe'])).toBe('RightToeBase');
  });
});
