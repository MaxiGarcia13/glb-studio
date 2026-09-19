import { Group, Object3D } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  resolveMultiSelectionPositionTargets,
  resolvePositionEditTargets,
  resolveSelectionRoots,
} from '@/modules/viewport/domain/resolve-position-edit-targets';
import { $editTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

describe('resolve-position-edit-targets', () => {
  beforeEach(() => {
    $editTool.set('edit');
    $selection.set({
      object: null,
      objects: [],
      modelIds: [],
      kind: 'parts',
    });
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  it('skips nested selection roots so a parent+child pair is not double-moved', () => {
    const parent = new Object3D();
    const child = new Object3D();
    parent.add(child);
    expect(resolveSelectionRoots([parent, child])).toEqual([parent]);
  });

  it('returns all part roots for Edit multi-select', () => {
    const a = new Object3D();
    const b = new Object3D();
    const scene = new Group();
    scene.add(a);
    scene.add(b);
    $model.set({
      models: [{ id: 'm1', fileName: 'a.glb', scene, source: 'created' }],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    $selection.set({
      object: b,
      objects: [a, b],
      modelIds: [],
      kind: 'parts',
    });

    const result = resolvePositionEditTargets();
    expect(result.targets.map((entry) => entry.object)).toEqual([a, b]);
    expect(result.primary).toBe(b);
    expect(result.space).toBe('local');
  });

  it('Settings multi targets ignore Move tool and still move part roots', () => {
    $editTool.set('move');
    const a = new Object3D();
    const b = new Object3D();
    const scene = new Group();
    scene.add(a);
    scene.add(b);
    $model.set({
      models: [{ id: 'm1', fileName: 'a.glb', scene, source: 'created' }],
      activeModelId: 'm1',
      previewModelIds: ['m1'],
      phase: 'loaded',
      error: null,
    });
    $selection.set({
      object: a,
      objects: [a, b],
      modelIds: [],
      kind: 'parts',
    });

    const nudgeTargets = resolvePositionEditTargets();
    expect(nudgeTargets.targets).toHaveLength(1);
    expect(nudgeTargets.targets[0]?.object).toBe(scene);

    const settingsTargets = resolveMultiSelectionPositionTargets();
    expect(settingsTargets.targets.map((entry) => entry.object)).toEqual([a, b]);
  });
});
