import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import { bakeBlendClip } from '@/modules/animation/domain/blend-bake';

function findTrack(clip: AnimationClip, name: string) {
  return clip.tracks.find((track) => track.name === name)!;
}

describe('bakeBlendClip', () => {
  it('uses primary duration and a combined display name', () => {
    const primary = new AnimationClip('A', 2, [
      new VectorKeyframeTrack('Hips.position', [0, 2], [0, 0, 0, 0, 0, 0]),
    ]);
    const secondary = new AnimationClip('B', 5, [
      new VectorKeyframeTrack('Hips.position', [0, 5], [1, 0, 0, 1, 0, 0]),
    ]);

    const baked = bakeBlendClip(primary, secondary, 0.5);
    expect(baked.name).toBe('A + B');
    expect(baked.duration).toBe(2);
  });

  it('lerps vector tracks by clamped blend weight', () => {
    const primary = new AnimationClip('A', 1, [
      new VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 0, 0, 0]),
    ]);
    const secondary = new AnimationClip('B', 1, [
      new VectorKeyframeTrack('Hips.position', [0, 1], [10, 0, 0, 10, 0, 0]),
    ]);

    const mid = bakeBlendClip(primary, secondary, 0.5);
    expect(Array.from(findTrack(mid, 'Hips.position').values.slice(0, 3))).toEqual([
      5,
      0,
      0,
    ]);

    const fullB = bakeBlendClip(primary, secondary, 2);
    expect(Array.from(findTrack(fullB, 'Hips.position').values.slice(0, 3))).toEqual([
      10,
      0,
      0,
    ]);

    const fullA = bakeBlendClip(primary, secondary, -1);
    expect(Array.from(findTrack(fullA, 'Hips.position').values.slice(0, 3))).toEqual([
      0,
      0,
      0,
    ]);
  });

  it('slerp quaternion tracks and unions track names from both clips', () => {
    const primary = new AnimationClip('A', 1, [
      new QuaternionKeyframeTrack('Hips.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    ]);
    const secondary = new AnimationClip('B', 1, [
      new QuaternionKeyframeTrack(
        'Hips.quaternion',
        [0, 1],
        [0, Math.SQRT1_2, 0, Math.SQRT1_2, 0, Math.SQRT1_2, 0, Math.SQRT1_2],
      ),
      new VectorKeyframeTrack('Spine.position', [0, 1], [0, 1, 0, 0, 1, 0]),
    ]);

    const baked = bakeBlendClip(primary, secondary, 0.5);
    const names = baked.tracks.map((track) => track.name).sort();
    expect(names).toEqual(['Hips.quaternion', 'Spine.position']);

    const q = findTrack(baked, 'Hips.quaternion').values;
    // 50% slerp identity → 90° Y ≈ half-angle (~45°)
    expect(q[0]).toBeCloseTo(0);
    expect(q[1]).toBeCloseTo(Math.sin(Math.PI / 8));
    expect(q[2]).toBeCloseTo(0);
    expect(q[3]).toBeCloseTo(Math.cos(Math.PI / 8));
  });
});
