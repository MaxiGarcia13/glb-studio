import { AnimationClip, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import { bakeTimeScale } from '@/modules/animation/domain/clip-bake';
import { trimClipWindow } from '@/modules/animation/domain/clip-trim';

function positionClip(
  times: number[],
  values: number[],
  duration = times[times.length - 1] ?? 0,
): AnimationClip {
  return new AnimationClip('walk', duration, [
    new VectorKeyframeTrack('Hips.position', times, values),
  ]);
}

function trackTimes(clip: AnimationClip): number[] {
  return Array.from(clip.tracks[0]!.times);
}

function trackValues(clip: AnimationClip): number[] {
  return Array.from(clip.tracks[0]!.values);
}

describe('trimClipWindow', () => {
  it('shifts keys so the window starts at t=0 and sets duration', () => {
    const source = positionClip(
      [0, 1, 2, 3],
      [0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0],
      3,
    );

    const trimmed = trimClipWindow(source, 1, 3);

    expect(trimmed.duration).toBe(2);
    expect(trackTimes(trimmed)).toEqual([0, 1, 2]);
    expect(trackValues(trimmed)).toEqual([1, 0, 0, 2, 0, 0, 3, 0, 0]);
    // Source unchanged
    expect(trackTimes(source)).toEqual([0, 1, 2, 3]);
  });

  it('clamps a zero-width window to duration 0', () => {
    const source = positionClip([0, 1], [0, 0, 0, 1, 0, 0], 1);
    const trimmed = trimClipWindow(source, 0.5, 0.5);
    expect(trimmed.duration).toBe(0);
  });

  it('keeps keys that land on the inclusive trim bounds', () => {
    const source = positionClip(
      [0, 0.5, 1],
      [0, 0, 0, 5, 0, 0, 10, 0, 0],
      1,
    );
    const trimmed = trimClipWindow(source, 0.5, 1);
    expect(trimmed.duration).toBe(0.5);
    expect(trackTimes(trimmed)).toEqual([0, 0.5]);
    expect(trackValues(trimmed)).toEqual([5, 0, 0, 10, 0, 0]);
  });
});

describe('bakeTimeScale', () => {
  it('returns the same clip reference when scale is 1', () => {
    const source = positionClip([0, 1], [0, 0, 0, 1, 0, 0], 1);
    expect(bakeTimeScale(source, 1)).toBe(source);
  });

  it('scales times and duration by 1/scale (faster → shorter)', () => {
    const source = positionClip([0, 1, 2], [0, 0, 0, 1, 0, 0, 2, 0, 0], 2);
    const baked = bakeTimeScale(source, 2);

    expect(baked).not.toBe(source);
    expect(baked.duration).toBe(1);
    expect(trackTimes(baked)).toEqual([0, 0.5, 1]);
    expect(trackTimes(source)).toEqual([0, 1, 2]);
  });

  it('scales times and duration by 1/scale (slower → longer)', () => {
    const source = positionClip([0, 1], [0, 0, 0, 1, 0, 0], 1);
    const baked = bakeTimeScale(source, 0.5);

    expect(baked.duration).toBe(2);
    expect(trackTimes(baked)).toEqual([0, 2]);
  });
});
