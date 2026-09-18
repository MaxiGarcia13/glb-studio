import { describe, expect, it } from 'vitest';

import { mixamoBoneVendor } from '@/modules/animation/adapters/bone-vendors/mixamo';

describe('mixamoBoneVendor.displayName', () => {
  it('returns the Mixamo local label and strips leading digits', () => {
    expect(mixamoBoneVendor.displayName('mixamorigHips')).toBe('Hips');
    expect(mixamoBoneVendor.displayName('mixamorig:LeftArm')).toBe('LeftArm');
    expect(mixamoBoneVendor.displayName('mixamorig8Hips')).toBe('Hips');
  });

  it('returns null for non-Mixamo names', () => {
    expect(mixamoBoneVendor.displayName('Hips')).toBeNull();
    expect(mixamoBoneVendor.displayName('Spine')).toBeNull();
  });
});

describe('mixamoBoneVendor.suggest', () => {
  it('prefers same-local Mixamo→Mixamo matches', () => {
    const targets = new Set(['mixamorigSpine1', 'Chest']);
    expect(mixamoBoneVendor.suggest('mixamorigSpine1', targets)).toBe(
      'mixamorigSpine1',
    );
  });

  it('falls back to canonical alias targets (Spine1 → Chest)', () => {
    expect(
      mixamoBoneVendor.suggest('mixamorigSpine1', new Set(['Chest', 'Hips'])),
    ).toBe('Chest');
  });

  it('matches bare local or canonical names on the target', () => {
    expect(
      mixamoBoneVendor.suggest('mixamorigHips', new Set(['Hips'])),
    ).toBe('Hips');
    expect(
      mixamoBoneVendor.suggest('mixamorigLeftArm', new Set(['LeftArm'])),
    ).toBe('LeftArm');
  });

  it('returns null when the source is not Mixamo or no target matches', () => {
    expect(mixamoBoneVendor.suggest('Hips', new Set(['Hips']))).toBeNull();
    expect(
      mixamoBoneVendor.suggest('mixamorigHips', new Set(['Spine'])),
    ).toBeNull();
  });
});
