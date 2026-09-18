import type { BindPoseDelta } from '@/modules/animation/domain/bind-pose-rebase';
import {
  AnimationClip,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';

import { describe, expect, it } from 'vitest';
import {
  composeBindPoseDeltas,
  computeBindPoseDelta,
  rebaseClipNode,
  rebaseClipWithOverrides,
} from '@/modules/animation/domain/bind-pose-rebase';

const IDENTITY_DELTA: BindPoseDelta = {
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  scale: [1, 1, 1],
};

describe('computeBindPoseDelta', () => {
  it('diffs position/scale and composes quaternion delta', () => {
    const from = {
      position: { x: 1, y: 2, z: 3 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    };
    const to = {
      position: { x: 2, y: 2, z: 3 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 2, y: 1, z: 1 },
    };

    expect(computeBindPoseDelta(from, to)).toEqual({
      position: [1, 0, 0],
      quaternion: [0, 0, 0, 1],
      scale: [2, 1, 1],
    });
  });
});

describe('composeBindPoseDeltas', () => {
  it('adds positions, multiplies scales, and multiplies quaternions', () => {
    const first: BindPoseDelta = {
      position: [1, 0, 0],
      quaternion: [0, 0, 0, 1],
      scale: [2, 1, 1],
    };
    const second: BindPoseDelta = {
      position: [0, 3, 0],
      quaternion: [0, 0, 0, 1],
      scale: [1, 2, 1],
    };

    expect(composeBindPoseDeltas(first, second)).toEqual({
      position: [1, 3, 0],
      quaternion: [0, 0, 0, 1],
      scale: [2, 2, 1],
    });
  });
});

describe('rebaseClipNode / rebaseClipWithOverrides', () => {
  it('no-ops on identity and mutates matching node tracks', () => {
    const clip = new AnimationClip('pose', 1, [
      new VectorKeyframeTrack('Hips.position', [0], [0, 1, 0]),
      new VectorKeyframeTrack('Hips.scale', [0], [1, 1, 1]),
      new QuaternionKeyframeTrack('Hips.quaternion', [0], [0, 0, 0, 1]),
      new VectorKeyframeTrack('Spine.position', [0], [0, 2, 0]),
    ]);

    rebaseClipNode(clip, 'Hips', IDENTITY_DELTA);
    expect(Array.from(clip.tracks[0].values)).toEqual([0, 1, 0]);

    rebaseClipWithOverrides(clip, {
      Hips: {
        position: [1, 0, 0],
        quaternion: [0, 0, 0, 1],
        scale: [2, 1, 1],
      },
    });

    expect(Array.from(clip.tracks[0].values)).toEqual([1, 1, 0]);
    expect(Array.from(clip.tracks[1].values)).toEqual([2, 1, 1]);
    expect(Array.from(clip.tracks[2].values)).toEqual([0, 0, 0, 1]);
    expect(Array.from(clip.tracks[3].values)).toEqual([0, 2, 0]);
  });
});
