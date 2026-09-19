import {
  AnimationClip,
  Bone,
  Group,
  Object3D,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';
import { describe, expect, it } from 'vitest';

import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { captureBindLengths } from '@/modules/animation/domain/bone-registry';
import { collectClipTargetNodeNames } from '@/modules/animation/domain/clip-validate';

function meshlessMixamoArmature(): { scene: Group; clip: AnimationClip } {
  const scene = new Group();
  scene.name = 'Scene';

  const hips = new Object3D();
  hips.name = 'mixamorigHips';
  hips.position.set(0, 1, 0);

  const spine = new Object3D();
  spine.name = 'mixamorigSpine';
  spine.position.set(0, 0.2, 0);
  hips.add(spine);
  scene.add(hips);

  const clip = new AnimationClip('Walk', 1, [
    new VectorKeyframeTrack('mixamorigHips.position', [0, 1], [0, 1, 0, 0, 1.1, 0]),
    new QuaternionKeyframeTrack(
      'mixamorigSpine.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    ),
  ]);

  return { scene, clip };
}

describe('collectClipTargetNodeNames', () => {
  it('collects node names from TRS tracks', () => {
    const { clip } = meshlessMixamoArmature();
    expect(collectClipTargetNodeNames([clip])).toEqual(
      new Set(['mixamorigHips', 'mixamorigSpine']),
    );
  });
});

describe('captureBindFrames meshless fallback', () => {
  it('returns empty without clips when the scene has no Bones', () => {
    const { scene } = meshlessMixamoArmature();
    expect(captureBindFrames(scene)).toEqual({});
  });

  it('captures rest frames from clip target Object3Ds when there are no Bones', () => {
    const { scene, clip } = meshlessMixamoArmature();
    const frames = captureBindFrames(scene, [clip]);

    expect(frames.mixamorigHips?.localPosition).toEqual([0, 1, 0]);
    expect(frames.mixamorigSpine?.localPosition).toEqual([0, 0.2, 0]);
    expect(frames.mixamorigHips?.parentWorldQuaternion).toEqual([0, 0, 0, 1]);
    expect(frames.mixamorigSpine?.parentWorldQuaternion).toBeDefined();
  });

  it('prefers Bone capture over clip-target fallback when Bones exist', () => {
    const scene = new Group();
    const bone = new Bone();
    bone.name = 'Hips';
    bone.position.set(0, 2, 0);
    scene.add(bone);

    const clip = new AnimationClip('Idle', 1, [
      new VectorKeyframeTrack('mixamorigHips.position', [0], [0, 1, 0]),
    ]);

    const frames = captureBindFrames(scene, [clip]);
    expect(frames).toEqual({
      Hips: {
        localPosition: [0, 2, 0],
        parentWorldQuaternion: [0, 0, 0, 1],
      },
    });
    expect(frames.mixamorigHips).toBeUndefined();
  });
});

describe('captureBindLengths meshless fallback', () => {
  it('returns empty without clips when the scene has no Bones', () => {
    const { scene } = meshlessMixamoArmature();
    expect(captureBindLengths(scene)).toEqual({});
  });

  it('captures lengths from clip target Object3Ds when there are no Bones', () => {
    const { scene, clip } = meshlessMixamoArmature();
    const lengths = captureBindLengths(scene, [clip]);

    expect(lengths.mixamorigHips).toBeCloseTo(1);
    expect(lengths.mixamorigSpine).toBeCloseTo(0.2);
  });
});
