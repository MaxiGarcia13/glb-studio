import type { HipsRebaseFrames } from '@/modules/animation/domain/hips-rebase';
import {
  AnimationClip,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';

import { describe, expect, it } from 'vitest';
import { remapClipTracks } from '@/modules/animation/domain/clip-remap';

const IDENTITY_HIPS_REBASE: HipsRebaseFrames = {
  sourceParentWorldQuaternion: [0, 0, 0, 1],
  targetParentWorldQuaternion: [0, 0, 0, 1],
  sourceBindLocalPosition: [0, 1, 0],
  targetBindLocalPosition: [0, 2, 0],
};

function findTrack(clip: AnimationClip, name: string) {
  return clip.tracks.find((track) => track.name === name);
}

describe('remapClipTracks', () => {
  it('rejects an empty mapping', () => {
    const source = new AnimationClip('walk', 1, [
      new VectorKeyframeTrack('Hips.position', [0], [0, 1, 0]),
    ]);
    expect(remapClipTracks(source, new Map())).toEqual({
      clip: null,
      skippedBones: [],
      error: 'Map at least one bone before applying',
    });
  });

  it('renames mapped tracks and reports skipped bones', () => {
    const source = new AnimationClip('walk', 1, [
      new VectorKeyframeTrack('srcHips.position', [0], [0, 1, 0]),
      new QuaternionKeyframeTrack('srcSpine.quaternion', [0], [0, 0, 0, 1]),
      new VectorKeyframeTrack('Ghost.scale', [0], [1, 1, 1]),
    ]);
    const result = remapClipTracks(
      source,
      new Map([
        ['srcHips', 'Hips'],
        ['srcSpine', 'Spine'],
      ]),
    );

    expect(result.error).toBeNull();
    expect(result.skippedBones).toEqual(['Ghost']);
    expect(result.clip?.tracks.map((t) => t.name).sort()).toEqual([
      'Hips.position',
      'Spine.quaternion',
    ]);
  });

  it('scales non-hips position tracks by positionScale', () => {
    const source = new AnimationClip('walk', 1, [
      new VectorKeyframeTrack('srcHips.position', [0], [1, 2, 3]),
    ]);
    const result = remapClipTracks(
      source,
      new Map([['srcHips', 'Hips']]),
      { positionScale: 2 },
    );
    expect(Array.from(findTrack(result.clip!, 'Hips.position')!.values)).toEqual([
      2,
      4,
      6,
    ]);
  });

  it('keeps only hips position when hipsSourceBone is set and rebases it', () => {
    const source = new AnimationClip('walk', 1, [
      new VectorKeyframeTrack('srcHips.position', [0], [0, 1, 0]),
      new VectorKeyframeTrack('srcSpine.position', [0], [0, 3, 0]),
      new QuaternionKeyframeTrack('srcHips.quaternion', [0], [0, 0, 0, 1]),
    ]);
    const result = remapClipTracks(
      source,
      new Map([
        ['srcHips', 'Hips'],
        ['srcSpine', 'Spine'],
      ]),
      {
        hipsSourceBone: 'srcHips',
        hipsRebase: IDENTITY_HIPS_REBASE,
        positionScale: 1,
      },
    );

    expect(result.clip?.tracks.map((t) => t.name).sort()).toEqual([
      'Hips.position',
      'Hips.quaternion',
    ]);
    // bind delta 0 → target bind [0,2,0]
    expect(Array.from(findTrack(result.clip!, 'Hips.position')!.values)).toEqual([
      0,
      2,
      0,
    ]);
  });

  it('errors when every track is skipped', () => {
    const source = new AnimationClip('walk', 1, [
      new VectorKeyframeTrack('Ghost.position', [0], [0, 1, 0]),
    ]);
    expect(remapClipTracks(source, new Map([['Hips', 'Hips']]))).toEqual({
      clip: null,
      skippedBones: ['Ghost'],
      error: 'No tracks left after skipping unmapped bones',
    });
  });
});
