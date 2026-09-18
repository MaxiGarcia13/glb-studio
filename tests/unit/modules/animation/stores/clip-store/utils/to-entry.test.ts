import { AnimationClip, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import {
  toEntry,
  toFailedFileEntry,
  toNewAnimationEntry,
} from '@/modules/animation/stores/clip-store/utils/to-entry';

describe('toEntry', () => {
  it('builds a ready entry shape when validation passes', () => {
    const clip = new AnimationClip('Idle', 2, [
      new VectorKeyframeTrack('Hips.position', [0], [0, 0, 0]),
    ]);
    const entry = toEntry(
      { valid: true, error: null },
      'clip-1',
      clip,
      'char.glb',
      { Hips: 1 },
      { Hips: {
        localPosition: [0, 1, 0],
        parentWorldQuaternion: [0, 0, 0, 1],
      } },
      'model-1',
    );

    expect(entry).toMatchObject({
      id: 'clip-1-Idle',
      name: 'Idle',
      sourceFile: 'char.glb',
      status: 'ready',
      error: null,
      timeScale: 1,
      sourceBindLengths: { Hips: 1 },
      ownerModelId: 'model-1',
      rootPositionByModelId: {},
      rootRotationByModelId: {},
      rootScaleByModelId: {},
    });
    expect(entry.clip).toBe(clip);
    expect(entry.sourceClip).toBe(clip);
    expect(entry.sourceBindFrames.Hips?.localPosition).toEqual([0, 1, 0]);
  });

  it('builds an error entry shape when validation fails', () => {
    const clip = new AnimationClip('Bad', 1, []);
    const entry = toEntry(
      { valid: false, error: '1 track doesn\'t match this model' },
      'clip-2',
      clip,
      'anim.glb',
      {},
    );

    expect(entry).toMatchObject({
      id: 'clip-2-Bad',
      status: 'error',
      error: '1 track doesn\'t match this model',
      ownerModelId: null,
    });
  });
});

describe('toFailedFileEntry', () => {
  it('builds an error entry from an Error or unknown failure', () => {
    const fromError = toFailedFileEntry('id', 'broken.glb', new Error('boom'), 'm1');
    expect(fromError).toMatchObject({
      id: 'id-file',
      name: 'broken.glb',
      sourceFile: 'broken.glb',
      clip: null,
      sourceClip: null,
      status: 'error',
      error: 'boom',
      ownerModelId: 'm1',
    });

    const fromUnknown = toFailedFileEntry('id', 'x.glb', 'nope');
    expect(fromUnknown.error).toBe('Failed to import clip');
    expect(fromUnknown.ownerModelId).toBeNull();
  });
});

describe('toNewAnimationEntry', () => {
  it('builds a draft clip with a one-second empty AnimationClip', () => {
    const entry = toNewAnimationEntry('id', 'New take', 'model-9');
    expect(entry).toMatchObject({
      id: 'id-new',
      name: 'New take',
      sourceFile: 'New animation',
      status: 'draft',
      error: null,
      ownerModelId: 'model-9',
    });
    expect(entry.clip).toBeInstanceOf(AnimationClip);
    expect(entry.sourceClip).toBeInstanceOf(AnimationClip);
    expect(entry.clip).not.toBe(entry.sourceClip);
    expect(entry.clip?.duration).toBe(1);
    expect(entry.clip?.tracks).toHaveLength(0);
  });
});
