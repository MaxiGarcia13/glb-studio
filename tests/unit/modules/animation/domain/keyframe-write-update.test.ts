import {
  AnimationClip,
  InterpolateDiscrete,
  InterpolateLinear,
  InterpolateSmooth,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';
import { describe, expect, it } from 'vitest';

import {
  deleteTrackKeyframe,
  getTrackInterpolation,
  insertTrackKeyframe,
  listSupportedTrackInterpolations,
  setTrackInterpolation,
  trackInterpolationLabel,
  updateTrackKeyframe,
} from '@/modules/animation/domain/keyframe-write';
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

describe('insertTrackKeyframe', () => {
  it('inserts a key at time with explicit values and re-sorts', () => {
    const result = insertTrackKeyframe(
      vectorClip(),
      'Hips.position',
      0.5,
      [9, 9, 9],
    );

    expect(result).not.toBeNull();
    expect(result!.keyIndex).toBe(1);
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(Array.from(track.times)).toEqual([0, 0.5, 1, 2]);
    expect(Array.from(track.values.slice(3, 6))).toEqual([9, 9, 9]);
  });

  it('upserts when time collides with an existing key', () => {
    const result = insertTrackKeyframe(
      vectorClip(),
      'Hips.position',
      1,
      [7, 7, 7],
    );

    expect(result!.keyIndex).toBe(1);
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(track.times).toHaveLength(3);
    expect(Array.from(track.values.slice(3, 6))).toEqual([7, 7, 7]);
  });

  it('samples the interpolant when values are omitted', () => {
    const result = insertTrackKeyframe(vectorClip(), 'Hips.position', 0.5);
    expect(result).not.toBeNull();
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    const sample = Array.from(track.values.slice(3, 6));
    expect(sample[0]).toBeCloseTo(0.5);
    expect(sample[1]).toBeCloseTo(1);
    expect(sample[2]).toBeCloseTo(1.5);
  });
});

describe('deleteTrackKeyframe', () => {
  it('removes a key and selects a neighbor', () => {
    const result = deleteTrackKeyframe(vectorClip(), 'Hips.position', 1);
    expect(result).not.toBeNull();
    expect(result!.keyIndex).toBe(1);
    const track = findTrackByName(result!.clip, 'Hips.position')!;
    expect(Array.from(track.times)).toEqual([0, 2]);
    expect(Array.from(track.values)).toEqual([0, 0, 0, 4, 5, 6]);
  });

  it('refuses to delete the last remaining key', () => {
    const clip = new AnimationClip('one', 1, [
      new VectorKeyframeTrack('Hips.position', [0], [1, 2, 3]),
    ]);
    expect(deleteTrackKeyframe(clip, 'Hips.position', 0)).toBeNull();
  });

  it('returns null for a bad index', () => {
    expect(deleteTrackKeyframe(vectorClip(), 'Hips.position', 99)).toBeNull();
  });
});

describe('track interpolation', () => {
  it('lists Discrete / Linear / Smooth for vector tracks', () => {
    const track = findTrackByName(vectorClip(), 'Hips.position')!;
    expect(listSupportedTrackInterpolations(track)).toEqual([
      InterpolateDiscrete,
      InterpolateLinear,
      InterpolateSmooth,
    ]);
    expect(getTrackInterpolation(track)).toBe(InterpolateLinear);
    expect(trackInterpolationLabel(InterpolateLinear)).toBe('Linear');
  });

  it('omits Smooth for quaternion tracks', () => {
    const track = new QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    expect(listSupportedTrackInterpolations(track)).toEqual([
      InterpolateDiscrete,
      InterpolateLinear,
    ]);
  });

  it('sets interpolation on a cloned clip', () => {
    const result = setTrackInterpolation(
      vectorClip(),
      'Hips.position',
      InterpolateDiscrete,
    );
    expect(result).not.toBeNull();
    const track = findTrackByName(result!, 'Hips.position')!;
    expect(getTrackInterpolation(track)).toBe(InterpolateDiscrete);
    expect(getTrackInterpolation(findTrackByName(vectorClip(), 'Hips.position')!))
      .toBe(InterpolateLinear);
  });

  it('rejects unsupported Smooth on quaternion', () => {
    const clip = new AnimationClip('q', 1, [
      new QuaternionKeyframeTrack(
        'Hips.quaternion',
        [0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
      ),
    ]);
    expect(setTrackInterpolation(clip, 'Hips.quaternion', InterpolateSmooth))
      .toBeNull();
  });
});
