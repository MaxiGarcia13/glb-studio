import { describe, expect, it } from 'vitest';

import { getKit, listStarterKits } from '@/modules/create/domain/kit';
import { isMeshKit, isSkinnedKit } from '@/modules/create/domain/kit-kind';

describe('kit kind discrimination', () => {
  it('classifies empty and house as mesh kits', () => {
    expect(isMeshKit(getKit('empty'))).toBe(true);
    expect(isSkinnedKit(getKit('empty'))).toBe(false);
    expect(isMeshKit(getKit('simple-building'))).toBe(true);
  });

  it('classifies Block robot as the skinned kit only', () => {
    const skinned = getKit('block-robot');

    expect(isSkinnedKit(skinned)).toBe(true);
    expect(isMeshKit(skinned)).toBe(false);
    expect(skinned.label).toBe('Block robot');
    if (isSkinnedKit(skinned)) {
      expect(skinned.skinnedAsset.url).toBe('/kits/block-robot.glb');
    }
  });

  it('lists house + skinned Block robot among starters', () => {
    const starters = listStarterKits();
    const ids = starters.map((kit) => kit.id);
    expect(ids).toEqual(['simple-building', 'block-robot']);
  });
});
