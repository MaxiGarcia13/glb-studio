import type { ClipEntry } from '@/modules/animation/types/clip';
import { AnimationClip, BoxGeometry, Group, Mesh, MeshStandardMaterial, SkinnedMesh } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { $clips } from '@/modules/animation/stores/clip-store';
import { skinCreatedModel } from '@/modules/create/actions/skin-created-model';
import { writeCreateJoint } from '@/modules/create/domain/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import * as convertModule from '@/modules/create/domain/skinning/convert-created-scene-to-skinned';
import { isUsableSkinnedModelScene } from '@/modules/import/domain/model-scene-kind';
import { $model } from '@/modules/viewport/stores/model-store';
import { clearSelection, selectObject } from '@/modules/viewport/stores/selection-store';

function clipEntry(overrides: Partial<ClipEntry>): ClipEntry {
  return {
    id: 'clip-1',
    name: 'pose',
    sourceFile: 'pose.glb',
    clip: new AnimationClip('pose', 1, []),
    sourceClip: null,
    status: 'ready',
    error: null,
    timeScale: 1,
    sourceBindLengths: {},
    sourceBindFrames: {},
    ownerModelId: null,
    rootPositionByModelId: {},
    rootRotationByModelId: {},
    rootScaleByModelId: {},
    ...overrides,
  };
}

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

function createGroup(name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateJoint(group);
  return group;
}

function skinnableScene(): Group {
  const scene = new Group();
  const hips = createGroup('Hips');
  hips.position.set(0, 1, 0);
  const torso = createPart('torso');
  scene.add(hips);
  hips.add(torso);
  return scene;
}

describe('skinCreatedModel', () => {
  beforeEach(() => {
    clearSelection();
    vi.restoreAllMocks();
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
    $clips.set({
      clips: [],
      activeClipId: null,
      activeSharedClipId: null,
      activeClipByModelId: {},
      blendBaseClip: null,
      blendClipId: null,
      blendWeight: 0,
      playing: false,
      loop: false,
      duration: 0,
      trimStart: 0,
      trimEnd: 0,
    });
  });

  it('swaps a created model onto the imported skinned path', () => {
    const scene = skinnableScene();
    $model.set({
      models: [
        {
          id: 'm1',
          fileName: 'hero.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    selectObject(scene.children[0]!);

    const result = skinCreatedModel('m1');
    const entry = $model.get().models[0]!;

    expect(result).toEqual({ ok: true });
    expect(entry.source).toBe('imported');
    expect(isUsableSkinnedModelScene(entry.scene)).toBe(true);
    expect(entry.scene).not.toBe(scene);
    expect($model.get().error).toBeNull();

    let skinnedMeshes = 0;
    entry.scene.traverse((object) => {
      if (object instanceof SkinnedMesh) {
        skinnedMeshes += 1;
      }
    });
    expect(skinnedMeshes).toBe(1);
  });

  it('rejects models that are not skinnable without mutating the scene', () => {
    const scene = new Group();
    scene.add(createPart('box'));
    $model.set({
      models: [
        {
          id: 'm1',
          fileName: 'prop.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });

    const result = skinCreatedModel('m1');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Add joints before skinning');
    expect($model.get().models[0]!.scene).toBe(scene);
    expect($model.get().models[0]!.source).toBe('created');
    expect($model.get().error).toBe('Add joints before skinning');
  });

  it('keeps the original library scene when conversion fails', () => {
    const scene = skinnableScene();
    $model.set({
      models: [
        {
          id: 'm1',
          fileName: 'hero.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });

    vi.spyOn(convertModule, 'convertCreatedSceneToSkinned').mockImplementation(() => {
      throw new Error('corrupt intermediate');
    });

    const result = skinCreatedModel('m1');

    expect(result).toEqual({ ok: false, error: 'corrupt intermediate' });
    expect($model.get().models[0]!.scene).toBe(scene);
    expect($model.get().models[0]!.source).toBe('created');
    expect($model.get().error).toBe('corrupt intermediate');
  });

  it('drops owned clips after a successful skin', () => {
    const scene = skinnableScene();
    $model.set({
      models: [
        {
          id: 'm1',
          fileName: 'hero.glb',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    $clips.set({
      ...$clips.get(),
      clips: [
        clipEntry({ id: 'owned', name: 'mesh-pose', ownerModelId: 'm1' }),
        clipEntry({ id: 'shared', name: 'shared-walk', ownerModelId: null }),
      ],
    });

    const result = skinCreatedModel('m1');

    expect(result.ok).toBe(true);
    expect($clips.get().clips.map((entry) => entry.id)).toEqual(['shared']);
  });
});
