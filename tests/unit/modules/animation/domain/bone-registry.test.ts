import { Bone, Group, SkinnedMesh } from 'three';
import { describe, expect, it } from 'vitest';

import {
  boneDisplayName,
  boneOptionLabel,
  buildAutoMapping,
  buildTargetBoneNames,
  extractSourceBoneNames,
  suggestTargetBone,
} from '@/modules/animation/domain/bone-registry';

describe('suggestTargetBone', () => {
  it('prefers an exact name match before vendor suggestions', () => {
    const targets = new Set(['mixamorigHips', 'Hips']);
    expect(suggestTargetBone('mixamorigHips', targets)).toBe('mixamorigHips');
    expect(suggestTargetBone('Hips', targets)).toBe('Hips');
  });

  it('uses Mixamo vendor mapping when names differ', () => {
    expect(
      suggestTargetBone('mixamorigHips', new Set(['Hips', 'Spine'])),
    ).toBe('Hips');
  });

  it('returns null when nothing matches', () => {
    expect(suggestTargetBone('Unknown', new Set(['Hips']))).toBeNull();
  });
});

describe('boneDisplayName / boneOptionLabel', () => {
  it('shortens Mixamo names and keeps unknown names raw', () => {
    expect(boneDisplayName('mixamorigLeftArm')).toBe('LeftArm');
    expect(boneDisplayName('CustomRoot')).toBe('CustomRoot');
  });

  it('disambiguates colliding display labels with the raw bone id', () => {
    const siblings = ['mixamorigHips', 'mixamorig8Hips', 'Spine'];
    expect(boneOptionLabel('mixamorigHips', siblings)).toBe(
      'Hips (mixamorigHips)',
    );
    expect(boneOptionLabel('Spine', siblings)).toBe('Spine');
  });
});

describe('buildAutoMapping', () => {
  it('maps every source bone that has a suggestion', () => {
    const mapping = buildAutoMapping(
      ['mixamorigHips', 'mixamorigSpine1', 'Unknown'],
      new Set(['Hips', 'Chest']),
    );
    expect([...mapping.entries()]).toEqual([
      ['mixamorigHips', 'Hips'],
      ['mixamorigSpine1', 'Chest'],
    ]);
  });
});

describe('extractSourceBoneNames', () => {
  it('strips known suffixes and dedupes bone names', () => {
    expect(
      extractSourceBoneNames(
        ['Hips.position', 'Hips.quaternion', 'Spine.scale', 'raw'],
        ['.position', '.quaternion', '.scale'],
      ).sort(),
    ).toEqual(['Hips', 'Spine', 'raw'].sort());
  });
});

describe('buildTargetBoneNames', () => {
  it('collects Bone names from the hierarchy and skinned skeletons', () => {
    const scene = new Group();
    const hips = new Bone();
    hips.name = 'Hips';
    scene.add(hips);

    const mesh = new SkinnedMesh();
    const arm = new Bone();
    arm.name = 'LeftArm';
    mesh.skeleton = { bones: [arm] } as SkinnedMesh['skeleton'];
    scene.add(mesh);

    const names = buildTargetBoneNames(scene);
    expect(names.has('Hips')).toBe(true);
    expect(names.has('LeftArm')).toBe(true);
    expect(names.has('')).toBe(false);
  });
});
