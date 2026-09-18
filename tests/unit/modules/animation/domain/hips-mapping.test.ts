import type { BoneBindFrame } from '@/modules/animation/types/clip';

import { describe, expect, it } from 'vitest';
import {
  getBindFrame,
  isHipsBoneName,
  resolveHipsMapping,
} from '@/modules/animation/domain/hips-mapping';

const FRAME: BoneBindFrame = {
  localPosition: [0, 1, 0],
  parentWorldQuaternion: [0, 0, 0, 1],
};

describe('isHipsBoneName', () => {
  it('recognizes canonical and Mixamo-style hips names', () => {
    expect(isHipsBoneName('Hips')).toBe(true);
    expect(isHipsBoneName('mixamorigHips')).toBe(true);
    expect(isHipsBoneName('mixamorig:Hips')).toBe(true);
    expect(isHipsBoneName('Armature_Hips')).toBe(true);
    expect(isHipsBoneName('hips')).toBe(true);
  });

  it('rejects non-hips bones', () => {
    expect(isHipsBoneName('Spine')).toBe(false);
    expect(isHipsBoneName('LeftHip')).toBe(false);
    expect(isHipsBoneName('HipsBone')).toBe(false);
  });
});

describe('resolveHipsMapping', () => {
  it('returns the first pair involving hips on either side', () => {
    const mapping = new Map([
      ['Spine', 'Spine'],
      ['mixamorigHips', 'Hips'],
      ['Head', 'Head'],
    ]);
    expect(resolveHipsMapping(mapping)).toEqual({
      sourceName: 'mixamorigHips',
      targetName: 'Hips',
    });
  });

  it('matches when only the target is hips', () => {
    expect(
      resolveHipsMapping(new Map([['Root', 'Armature_Hips']])),
    ).toEqual({ sourceName: 'Root', targetName: 'Armature_Hips' });
  });

  it('returns null when no hips pair exists', () => {
    expect(resolveHipsMapping(new Map([['Spine', 'Spine']]))).toBeNull();
    expect(resolveHipsMapping(new Map())).toBeNull();
  });
});

describe('getBindFrame', () => {
  it('returns the frame for a bone or null', () => {
    expect(getBindFrame({ Hips: FRAME }, 'Hips')).toEqual(FRAME);
    expect(getBindFrame({ Hips: FRAME }, 'Spine')).toBeNull();
  });
});
