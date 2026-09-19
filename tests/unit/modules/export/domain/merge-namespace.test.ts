import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';
import { AnimationClip, Group, Object3D, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import {
  buildMergeExportClips,
  buildUniqueModelPrefix,
  clipRecordsForMember,
  createModelNamespace,
  namespaceSceneGraph,
} from '@/modules/export/domain/merge-namespace';

function model(partial: Pick<ModelEntry, 'id' | 'fileName'> & Partial<ModelEntry>): ModelEntry {
  return {
    source: 'imported',
    scene: new Group(),
    ...partial,
  };
}

function readyOwnedClip(
  partial: Pick<ClipEntry, 'id' | 'name' | 'ownerModelId'> & { times?: number[] },
): ClipEntry {
  const times = partial.times ?? [0, 1];
  const values = times.flatMap((_, index) => [index, 0, 0]);
  return {
    id: partial.id,
    name: partial.name,
    sourceFile: 'clip.glb',
    clip: new AnimationClip(partial.name, times[times.length - 1] ?? 1, [
      new VectorKeyframeTrack('Hips.position', times, values),
    ]),
    sourceClip: null,
    status: 'ready',
    error: null,
    timeScale: 1,
    sourceBindLengths: {},
    sourceBindFrames: {},
    ownerModelId: partial.ownerModelId,
    rootPositionByModelId: {},
    rootRotationByModelId: {},
    rootScaleByModelId: {},
  };
}

describe('buildUniqueModelPrefix', () => {
  it('uses the sanitized file base with a trailing underscore', () => {
    const taken = new Set<string>();
    expect(buildUniqueModelPrefix(model({ id: 'a', fileName: 'Hero.glb' }), taken)).toBe(
      'Hero_',
    );
    expect(taken.has('Hero')).toBe(true);
  });

  it('suffixes _2, _3 when the slug is already taken', () => {
    const taken = new Set(['Hero']);
    expect(buildUniqueModelPrefix(model({ id: 'a', fileName: 'Hero.glb' }), taken)).toBe(
      'Hero_2_',
    );
    expect(buildUniqueModelPrefix(model({ id: 'b', fileName: 'Hero.glb' }), taken)).toBe(
      'Hero_3_',
    );
  });

  it('replaces spaces in the file name', () => {
    const taken = new Set<string>();
    expect(
      buildUniqueModelPrefix(model({ id: 'a', fileName: 'My Hero.glb' }), taken),
    ).toBe('My_Hero_');
  });
});

describe('namespaceSceneGraph', () => {
  it('prefixes named nodes and skips empty names', () => {
    const root = new Group();
    root.name = 'Root';
    const hips = new Object3D();
    hips.name = 'Hips';
    const unnamed = new Object3D();
    root.add(hips, unnamed);

    const nameMap = namespaceSceneGraph(root, 'Hero_');

    expect(root.name).toBe('Hero_Root');
    expect(hips.name).toBe('Hero_Hips');
    expect(unnamed.name).toBe('');
    expect(nameMap.get('Root')).toBe('Hero_Root');
    expect(nameMap.get('Hips')).toBe('Hero_Hips');
    expect(nameMap.has('')).toBe(false);
  });
});

describe('createModelNamespace', () => {
  it('returns prefix, nameMap, and model metadata after renaming the clone', () => {
    const scene = new Group();
    scene.name = 'Root';
    const entry = model({ id: 'm1', fileName: 'Hero.glb', scene });
    const ns = createModelNamespace(entry, scene, 'Hero_');

    expect(ns).toMatchObject({
      modelId: 'm1',
      fileName: 'Hero.glb',
      source: 'imported',
      prefix: 'Hero_',
    });
    expect(scene.name).toBe('Hero_Root');
    expect(ns.nameMap.get('Root')).toBe('Hero_Root');
  });
});

describe('buildMergeExportClips', () => {
  it('packs owned ready clips with remapped tracks and unique export names', () => {
    const sceneA = new Group();
    const hips = new Object3D();
    hips.name = 'Hips';
    sceneA.add(hips);
    const nsA = createModelNamespace(
      model({ id: 'a', fileName: 'A.glb' }),
      sceneA,
      'A_',
    );

    const sceneB = new Group();
    const hipsB = new Object3D();
    hipsB.name = 'Hips';
    sceneB.add(hipsB);
    const nsB = createModelNamespace(
      model({ id: 'b', fileName: 'B.glb' }),
      sceneB,
      'B_',
    );

    const clips = [
      readyOwnedClip({ id: '1', name: 'Walk', ownerModelId: 'a' }),
      readyOwnedClip({ id: '2', name: 'Walk', ownerModelId: 'b' }),
      readyOwnedClip({ id: '3', name: 'Shared', ownerModelId: null }),
      {
        ...readyOwnedClip({ id: '4', name: 'Broken', ownerModelId: 'a' }),
        status: 'error' as const,
        error: 'bad',
        clip: null,
      },
    ];

    const records = buildMergeExportClips([nsA, nsB], clips);
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      modelId: 'a',
      prefix: 'A_',
      name: 'Walk',
      exportName: 'Walk',
    });
    expect(records[1]).toMatchObject({
      modelId: 'b',
      name: 'Walk',
      exportName: 'Walk-2',
    });
    expect(records[0]!.clip.tracks[0]!.name).toBe('A_Hips.position');
    expect(records[1]!.clip.tracks[0]!.name).toBe('B_Hips.position');

    expect(clipRecordsForMember(records, 'a')).toEqual([
      { exportName: 'Walk', name: 'Walk' },
    ]);
    expect(clipRecordsForMember(records, 'missing')).toEqual([]);
  });
});
