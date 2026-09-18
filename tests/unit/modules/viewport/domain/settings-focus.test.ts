import { Bone, BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

import { resolveSettingsFocus } from '@/modules/viewport/domain/settings-focus';
import { $model } from '@/modules/viewport/stores/model-store';
import {
  clearSelection,
  selectObject,
} from '@/modules/viewport/stores/selection-store';

describe('resolveSettingsFocus', () => {
  beforeEach(() => {
    clearSelection();
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  it('keeps Animation-capable bone focus when a bone is selected', () => {
    const scene = new Group();
    const bone = new Bone();
    bone.name = 'mixamorig8LeftLeg';
    scene.add(bone);

    $model.set({
      models: [
        {
          id: 'm1',
          fileName: 'char.glb',
          scene,
          source: 'imported',
        },
      ],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    selectObject(bone);

    expect(resolveSettingsFocus()).toMatchObject({
      kind: 'bone',
      partObject: bone,
      modelTransformTarget: null,
    });
  });

  it('uses part focus for a non-bone mesh', () => {
    const scene = new Group();
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    mesh.name = 'Capsule';
    scene.add(mesh);

    $model.set({
      models: [
        {
          id: 'm1',
          fileName: 'created',
          scene,
          source: 'created',
        },
      ],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    selectObject(mesh);

    expect(resolveSettingsFocus().kind).toBe('part');
  });
});
