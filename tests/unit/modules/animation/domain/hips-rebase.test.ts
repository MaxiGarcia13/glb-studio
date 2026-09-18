import type { HipsRebaseFrames } from '@/modules/animation/domain/hips-rebase';
import { QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';

import { describe, expect, it } from 'vitest';
import {
  rebaseHipsPositionTrack,
  rebaseHipsQuaternionTrack,
} from '@/modules/animation/domain/hips-rebase';

const IDENTITY: [number, number, number, number] = [0, 0, 0, 1];

describe('rebaseHipsPositionTrack', () => {
  it('maps delta-from-bind into the target bind frame', () => {
    const frames: HipsRebaseFrames = {
      sourceParentWorldQuaternion: IDENTITY,
      targetParentWorldQuaternion: IDENTITY,
      sourceBindLocalPosition: [0, 1, 0],
      targetBindLocalPosition: [0, 2, 0],
    };
    const track = new VectorKeyframeTrack(
      'Hips.position',
      [0, 1],
      [0, 1, 0, 0, 2, 0],
    );

    rebaseHipsPositionTrack(track, frames, 1);

    expect(Array.from(track.values)).toEqual([0, 2, 0, 0, 3, 0]);
  });

  it('applies positionScale to the bind delta before reparenting', () => {
    const frames: HipsRebaseFrames = {
      sourceParentWorldQuaternion: IDENTITY,
      targetParentWorldQuaternion: IDENTITY,
      sourceBindLocalPosition: [0, 0, 0],
      targetBindLocalPosition: [0, 0, 0],
    };
    const track = new VectorKeyframeTrack('Hips.position', [0], [1, 0, 0]);

    rebaseHipsPositionTrack(track, frames, 2);

    expect(Array.from(track.values)).toEqual([2, 0, 0]);
  });
});

describe('rebaseHipsQuaternionTrack', () => {
  it('leaves samples unchanged when parent worlds are identity', () => {
    const frames: HipsRebaseFrames = {
      sourceParentWorldQuaternion: IDENTITY,
      targetParentWorldQuaternion: IDENTITY,
      sourceBindLocalPosition: [0, 0, 0],
      targetBindLocalPosition: [0, 0, 0],
    };
    const track = new QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0],
      [0, 0, 0, 1],
    );

    rebaseHipsQuaternionTrack(track, frames);

    expect(Array.from(track.values)).toEqual([0, 0, 0, 1]);
  });

  it('rebases local rotation through parent world frames', () => {
    // 90° around Y for source parent; identity target parent.
    const y90: [number, number, number, number] = [0, Math.SQRT1_2, 0, Math.SQRT1_2];
    const frames: HipsRebaseFrames = {
      sourceParentWorldQuaternion: y90,
      targetParentWorldQuaternion: IDENTITY,
      sourceBindLocalPosition: [0, 0, 0],
      targetBindLocalPosition: [0, 0, 0],
    };
    const track = new QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0],
      [0, 0, 0, 1],
    );

    rebaseHipsQuaternionTrack(track, frames);

    // q' = I⁻¹ * R_src * I = R_src
    expect(track.values[0]).toBeCloseTo(0);
    expect(track.values[1]).toBeCloseTo(Math.SQRT1_2);
    expect(track.values[2]).toBeCloseTo(0);
    expect(track.values[3]).toBeCloseTo(Math.SQRT1_2);
  });
});
