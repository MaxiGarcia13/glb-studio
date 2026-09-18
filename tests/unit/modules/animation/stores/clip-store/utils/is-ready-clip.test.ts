import type { ClipEntry } from '@/modules/animation/types/clip';
import { AnimationClip } from 'three';

import { describe, expect, it } from 'vitest';
import { isReadyClip } from '@/modules/animation/stores/clip-store/utils/is-ready-clip';

function baseEntry(overrides: Partial<ClipEntry>): ClipEntry {
  return {
    id: 'id',
    name: 'clip',
    sourceFile: 'file.glb',
    clip: null,
    sourceClip: null,
    status: 'error',
    error: 'x',
    timeScale: 1,
    sourceBindLengths: {},
    sourceBindFrames: {},
    ownerModelId: null,
    rootPositionByModelId: {},
    rootRotationByModelId: {},
    rootScaleByModelId: {},
    ...overrides,
  };
}

describe('isReadyClip', () => {
  it('is true for ready/draft entries that carry a clip', () => {
    const clip = new AnimationClip('walk', 1, []);
    expect(isReadyClip(baseEntry({ status: 'ready', clip, error: null }))).toBe(true);
    expect(isReadyClip(baseEntry({ status: 'draft', clip, error: null }))).toBe(true);
  });

  it('is false for missing, error, or clip-less entries', () => {
    expect(isReadyClip(undefined)).toBe(false);
    expect(
      isReadyClip(baseEntry({ status: 'error', clip: new AnimationClip('x', 1, []) })),
    ).toBe(false);
    expect(isReadyClip(baseEntry({ status: 'ready', clip: null, error: null }))).toBe(
      false,
    );
  });
});
