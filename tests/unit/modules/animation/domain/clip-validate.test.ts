import { AnimationClip, Group, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import {
  buildSkeletonNodeSet,
  splitTrackName,
  validateClipAgainstSkeleton,
} from '@/modules/animation/domain/clip-validate';

function clipWithTracks(...names: string[]): AnimationClip {
  const tracks = names.map((name) => {
    if (name.endsWith('.quaternion')) {
      return new QuaternionKeyframeTrack(name, [0], [0, 0, 0, 1]);
    }
    return new VectorKeyframeTrack(name, [0], [0, 0, 0]);
  });
  return new AnimationClip('test', 1, tracks);
}

describe('splitTrackName', () => {
  it('splits known property suffixes', () => {
    expect(splitTrackName('Hips.position')).toEqual({
      nodeName: 'Hips',
      suffix: '.position',
    });
    expect(splitTrackName('Spine.quaternion')).toEqual({
      nodeName: 'Spine',
      suffix: '.quaternion',
    });
    expect(splitTrackName('Mesh.scale')).toEqual({
      nodeName: 'Mesh',
      suffix: '.scale',
    });
    expect(splitTrackName('Face.morphTargetInfluences')).toEqual({
      nodeName: 'Face',
      suffix: '.morphTargetInfluences',
    });
  });

  it('returns the full name when there is no known suffix', () => {
    expect(splitTrackName('Hips')).toEqual({ nodeName: 'Hips', suffix: null });
    expect(splitTrackName('Hips.rotation')).toEqual({
      nodeName: 'Hips.rotation',
      suffix: null,
    });
  });
});

describe('buildSkeletonNodeSet', () => {
  it('collects object names and uuids', () => {
    const root = new Group();
    root.name = 'Root';
    const hips = new Group();
    hips.name = 'Hips';
    root.add(hips);

    const names = buildSkeletonNodeSet(root);
    expect(names.has('Root')).toBe(true);
    expect(names.has('Hips')).toBe(true);
    expect(names.has(root.uuid)).toBe(true);
    expect(names.has(hips.uuid)).toBe(true);
  });
});

describe('validateClipAgainstSkeleton', () => {
  it('accepts tracks whose nodes exist in the skeleton set', () => {
    const clip = clipWithTracks('Hips.position', 'Spine.quaternion');
    expect(validateClipAgainstSkeleton(clip, new Set(['Hips', 'Spine']))).toEqual({
      valid: true,
      error: null,
    });
  });

  it('reports a singular mismatch count for one unique missing node', () => {
    const clip = clipWithTracks('Hips.position', 'Missing.scale');
    expect(validateClipAgainstSkeleton(clip, new Set(['Hips']))).toEqual({
      valid: false,
      error: '1 track doesn\'t match this model',
    });
  });

  it('dedupes mismatch counts across tracks on the same missing node', () => {
    const clip = clipWithTracks('Ghost.position', 'Ghost.scale');
    expect(validateClipAgainstSkeleton(clip, new Set(['Hips']))).toEqual({
      valid: false,
      error: '1 track doesn\'t match this model',
    });
  });

  it('reports a plural mismatch count for multiple unique failures', () => {
    const clip = clipWithTracks('A.position', 'B.scale', 'raw');
    expect(validateClipAgainstSkeleton(clip, new Set(['Hips']))).toEqual({
      valid: false,
      error: '3 tracks don\'t match this model',
    });
  });

  it('treats missing suffix or empty node as mismatches', () => {
    const clip = clipWithTracks('.position', 'Hips.rotation');
    expect(validateClipAgainstSkeleton(clip, new Set(['Hips']))).toEqual({
      valid: false,
      error: '2 tracks don\'t match this model',
    });
  });
});
