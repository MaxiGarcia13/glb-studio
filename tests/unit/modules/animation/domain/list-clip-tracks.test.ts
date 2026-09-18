import { AnimationClip, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import {
  clipTrackDisplayLabel,
  filterClipTracksByNode,
  listClipTracks,
  trackValueChannelLabels,
} from '@/modules/animation/domain/list-clip-tracks';

function clipWithTracks(...names: string[]): AnimationClip {
  const tracks = names.map(
    (name) => new VectorKeyframeTrack(name, [0, 1], [0, 0, 0, 1, 1, 1]),
  );
  return new AnimationClip('test', 1, tracks);
}

describe('listClipTracks', () => {
  it('lists tracks with parsed node, suffix, and key count', () => {
    const clip = clipWithTracks('Hips.position', 'Spine.quaternion');
    const listed = listClipTracks(clip);

    expect(listed).toHaveLength(2);
    expect(listed[0]).toMatchObject({
      name: 'Hips.position',
      nodeName: 'Hips',
      suffix: '.position',
      valueSize: 3,
      keyCount: 2,
    });
    expect(listed[1].suffix).toBe('.quaternion');
  });
});

describe('filterClipTracksByNode', () => {
  it('keeps tracks for the node name only', () => {
    const tracks = listClipTracks(
      clipWithTracks('Hips.position', 'Hips.scale', 'Spine.position'),
    );

    expect(filterClipTracksByNode(tracks, 'Hips').map((t) => t.name)).toEqual([
      'Hips.position',
      'Hips.scale',
    ]);
    expect(filterClipTracksByNode(tracks, null)).toEqual([]);
    expect(filterClipTracksByNode(tracks, 'Missing')).toEqual([]);
  });
});

describe('clipTrackDisplayLabel', () => {
  it('joins node + suffix when present', () => {
    const [hips] = listClipTracks(clipWithTracks('Hips.position'));
    expect(clipTrackDisplayLabel(hips)).toBe('Hips.position');
  });
});

describe('trackValueChannelLabels', () => {
  it('uses XYZ for position and scale', () => {
    expect(trackValueChannelLabels('Hips.position', 3)).toEqual(['X', 'Y', 'Z']);
    expect(trackValueChannelLabels('Hips.scale', 3)).toEqual(['X', 'Y', 'Z']);
  });

  it('uses XYZW for quaternion', () => {
    expect(trackValueChannelLabels('Hips.quaternion', 4)).toEqual([
      'X',
      'Y',
      'Z',
      'W',
    ]);
  });

  it('falls back to vN for unknown tracks', () => {
    expect(trackValueChannelLabels('Mesh.morphTargetInfluences', 2)).toEqual([
      'v0',
      'v1',
    ]);
  });
});
