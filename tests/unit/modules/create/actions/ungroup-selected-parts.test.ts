import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  getUngroupPartsAvailability,
  ungroupSelectedParts,
} from '@/modules/create/actions/ungroup-selected-parts';
import { createEmptyPartGroup } from '@/modules/create/domain/hierarchy/create-part-group';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection, clearSelection, selectObject } from '@/modules/viewport/stores/selection-store';

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

function setCreatedModel(scene: Group): void {
  $model.set({
    models: [
      {
        id: 'model-1',
        fileName: 'created.glb',
        scene,
        source: 'created',
      },
    ],
    activeModelId: 'model-1',
    previewModelIds: ['model-1'],
    phase: 'idle',
    error: null,
  });
}

function selectParts(objects: Mesh[]): void {
  $selection.set({
    object: objects[objects.length - 1] ?? null,
    objects,
    modelIds: [],
    kind: 'parts',
  });
}

describe('getUngroupPartsAvailability', () => {
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

  it('disables when selected parts sit at the model root', () => {
    const scene = new Group();
    const a = createPart('a');
    const b = createPart('b');
    scene.add(a, b);
    setCreatedModel(scene);
    selectParts([a, b]);

    expect(getUngroupPartsAvailability()).toEqual({
      enabled: false,
      reason: 'Select a group, or parts inside a group',
    });
  });

  it('disables when parts sit under a connector (use Unjoint)', () => {
    const scene = new Group();
    const joint = createEmptyPartGroup(scene, { name: 'RightFoot', role: 'joint' });
    const foot = createPart('foot');
    joint.add(foot);
    setCreatedModel(scene);
    selectObject(foot);

    expect(getUngroupPartsAvailability().enabled).toBe(false);
  });

  it('enables when a plain group is selected', () => {
    const scene = new Group();
    const group = createEmptyPartGroup(scene, { role: 'group' });
    const part = createPart('box');
    group.add(part);
    setCreatedModel(scene);
    selectObject(group);

    expect(getUngroupPartsAvailability().enabled).toBe(true);
  });

  it('enables when selected parts sit directly under a plain group', () => {
    const scene = new Group();
    const group = createEmptyPartGroup(scene, { role: 'group' });
    const part = createPart('box');
    group.add(part);
    setCreatedModel(scene);
    selectObject(part);

    expect(getUngroupPartsAvailability()).toMatchObject({
      enabled: true,
      reason: 'Move selected parts out of their group',
    });
  });
});

describe('ungroupSelectedParts', () => {
  beforeEach(() => {
    clearSelection();
  });

  it('lifts parts out of a plain group without touching connector children', () => {
    const scene = new Group();
    const group = createEmptyPartGroup(scene, { role: 'group' });
    const joint = createEmptyPartGroup(scene, { name: 'Hips', role: 'joint' });
    const inGroup = createPart('inGroup');
    const underJoint = createPart('underJoint');
    group.add(inGroup);
    joint.add(underJoint);
    setCreatedModel(scene);
    selectParts([inGroup, underJoint]);

    expect(ungroupSelectedParts()).toBe(true);
    expect(inGroup.parent).toBe(scene);
    expect(underJoint.parent).toBe(joint);
  });
});
