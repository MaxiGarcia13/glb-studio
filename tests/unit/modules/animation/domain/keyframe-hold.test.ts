import {
  AnimationClip,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';
import { describe, expect, it } from 'vitest';

import { writeNodeKeyframe } from '@/modules/animation/domain/keyframe-hold';
import {
  findTrackByName,
  listTrackKeyframes,
} from '@/modules/animation/domain/list-clip-tracks';

const SAMPLE = {
  position: [9, 8, 7] as [number, number, number],
  quaternion: [0, 0, 0, 1] as [number, number, number, number],
  scale: [2, 2, 2] as [number, number, number],
};

function densePositionClip(): AnimationClip {
  return new AnimationClip('walk', 2, [
    new VectorKeyframeTrack(
      'Hips.position',
      [0, 0.5, 1, 1.5, 2],
      [
        0,
        0,
        0,
        1,
        0,
        0,
        2,
        0,
        0,
        3,
        0,
        0,
        4,
        0,
        0,
      ],
    ),
  ]);
}

describe('writeNodeKeyframe', () => {
  it('writes a hold plateau and drops keys strictly inside the window', () => {
    const source = densePositionClip();
    const result = writeNodeKeyframe(source, 'Hips', 1, SAMPLE);

    expect(result).not.toBe(source);
    expect(result.duration).toBe(2);

    const keys = listTrackKeyframes(findTrackByName(result, 'Hips.position')!);
    expect(keys).toEqual([
      { index: 0, time: 0, values: [0, 0, 0] },
      { index: 1, time: 0.5, values: [1, 0, 0] },
      { index: 2, time: 1, values: [9, 8, 7] },
      { index: 3, time: 2, values: [9, 8, 7] },
    ]);
    // Source untouched
    expect(Array.from(findTrackByName(source, 'Hips.position')!.times)).toEqual([
      0,
      0.5,
      1,
      1.5,
      2,
    ]);
  });

  it('upserts a single key when hold end equals playhead', () => {
    const source = densePositionClip();
    const result = writeNodeKeyframe(source, 'Hips', 1, SAMPLE, 1);

    const keys = listTrackKeyframes(findTrackByName(result, 'Hips.position')!);
    expect(keys.map((key) => key.time)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(keys[2]!.values).toEqual([9, 8, 7]);
  });

  it('creates missing position / quaternion / scale tracks', () => {
    const empty = new AnimationClip('empty', 1, []);
    const result = writeNodeKeyframe(empty, 'Spine', 0.25, SAMPLE);

    const position = findTrackByName(result, 'Spine.position')!;
    const quaternion = findTrackByName(result, 'Spine.quaternion')!;
    const scale = findTrackByName(result, 'Spine.scale')!;

    expect(Array.from(position.times)).toEqual([0.25, 1]);
    expect(Array.from(position.values)).toEqual([9, 8, 7, 9, 8, 7]);
    expect(quaternion).toBeInstanceOf(QuaternionKeyframeTrack);
    expect(Array.from(quaternion.times)).toEqual([0.25, 1]);
    expect(Array.from(scale.values)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('preserves vendor track names when matching by node + suffix', () => {
    const source = new AnimationClip('mixamo', 1, [
      new VectorKeyframeTrack(
        'mixamorigHips.position',
        [0, 1],
        [0, 0, 0, 1, 0, 0],
      ),
    ]);

    const result = writeNodeKeyframe(source, 'mixamorigHips', 0, SAMPLE);
    expect(findTrackByName(result, 'mixamorigHips.position')).toBeDefined();
    expect(findTrackByName(result, 'mixamorigHips.position')!.name).toBe(
      'mixamorigHips.position',
    );
    // Does not orphan a second Hips.position track
    expect(result.tracks.filter((track) => track.name.endsWith('.position'))).toHaveLength(1);
  });

  it('clamps hold end to clip duration', () => {
    const source = densePositionClip();
    const result = writeNodeKeyframe(source, 'Hips', 1.5, SAMPLE, 99);

    const keys = listTrackKeyframes(findTrackByName(result, 'Hips.position')!);
    expect(keys.map((key) => key.time)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(keys[3]!.values).toEqual([9, 8, 7]);
    expect(keys[4]!.values).toEqual([9, 8, 7]);
  });
});
