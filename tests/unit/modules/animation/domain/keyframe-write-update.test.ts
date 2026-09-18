import {
  AnimationClip,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';
import { describe, expect, it } from 'vitest';

import { updateTrackKeyframe } from '@/modules/animation/domain/keyframe-write';
import {
  findTrackByName,
  listTrackKeyframes,
} from '@/modules/animation/domain/list-clip-tracks';

function vectorClip(): AnimationClip {
  return new AnimationClip('test', 2, [
    new VectorKeyframeTrack(
      'Hips.position',
      [0, 1, 2],
      [0, 0, 0, 1, 2, 3, 4, 5, 6],
    ),
  ]);
}

describe('listTrackKeyframes', () => {
  it('returns time and values per index', () => {
    const track = findTrackByName(vectorClip(), 'Hips.position')!;
    expect(listTrackKeyframes(track)).toEqual([
      { index: 0, time: 0, values: [0, 0, 0] },
      { index: 1, time: 1, values: [1, 2, 3] },
      { index: 2, time: 2, values: [4, 5, 6] },
    ]);
  });
});

describe('updateTrackKeyframe', () => {
  it('updates values in place without reordering', () => {
    const result = updateTrackKeyframe(vectorClip(), 'Hips.position', 1, {
      values: [9, 8, 7],
    });

    expect(result).not.toBeNull();
    expect(result!.keyIndex).toBe(1);
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(Array.from(track.values)).toEqual([0, 0, 0, 9, 8, 7, 4, 5, 6]);
  });

  it('moves a key in time and re-sorts', () => {
    const result = updateTrackKeyframe(vectorClip(), 'Hips.position', 0, {
      time: 1.5,
    });

    expect(result).not.toBeNull();
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(Array.from(track.times)).toEqual([1, 1.5, 2]);
    expect(result!.keyIndex).toBe(1);
    expect(Array.from(track.values)).toEqual([1, 2, 3, 0, 0, 0, 4, 5, 6]);
  });

  it('replaces a colliding key when time matches another', () => {
    const result = updateTrackKeyframe(vectorClip(), 'Hips.position', 0, {
      time: 1,
      values: [10, 11, 12],
    });

    expect(result).not.toBeNull();
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(track.times).toHaveLength(2);
    expect(Array.from(track.times)).toEqual([1, 2]);
    expect(Array.from(track.values)).toEqual([10, 11, 12, 4, 5, 6]);
  });

  it('clamps time to clip duration', () => {
    const result = updateTrackKeyframe(vectorClip(), 'Hips.position', 1, {
      time: 99,
    });

    // Clamped to duration (2) replaces the existing key at t=2.
    expect(result!.keyIndex).toBe(1);
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(Array.from(track.times)).toEqual([0, 2]);
    expect(Array.from(track.values)).toEqual([0, 0, 0, 1, 2, 3]);
  });

  it('returns null for unknown track or bad value size', () => {
    expect(
      updateTrackKeyframe(vectorClip(), 'Missing.position', 0, { time: 0.5 }),
    ).toBeNull();
    expect(
      updateTrackKeyframe(vectorClip(), 'Hips.position', 1, { values: [1, 2] }),
    ).toBeNull();
  });

  it('accepts quaternion tracks', () => {
    const clip = new AnimationClip('q', 1, [
      new QuaternionKeyframeTrack(
        'Hips.quaternion',
        [0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
      ),
    ]);
    const result = updateTrackKeyframe(clip, 'Hips.quaternion', 1, {
      values: [0, 1, 0, 0],
    });
    expect(result).not.toBeNull();
    const track = findTrackByName(result!.clip, 'Hips.quaternion')!;
    expect(Array.from(track.values.slice(4))).toEqual([0, 1, 0, 0]);
  });
});
