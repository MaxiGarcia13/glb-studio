import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

import { applyUndoableCommand } from '@/modules/animation/stores/clip-store/actions/apply-undoable-command';
import {
  clearUndoStack,
  takeRedoCommand,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import { addPart } from '@/modules/create/actions/add-part';
import { deleteSelectedPart } from '@/modules/create/actions/delete-selected-part';
import { createEmptyPartGroup } from '@/modules/create/domain/hierarchy/create-part-group';
import { isCreateGroup } from '@/modules/create/domain/hierarchy/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { $model } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  clearSelection,
  selectObject,
} from '@/modules/viewport/stores/selection-store';

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

function selectParts(objects: Array<Mesh | Group>): void {
  $selection.set({
    object: objects[objects.length - 1] ?? null,
    objects,
    modelIds: [],
    kind: 'parts',
  });
}

function undoOnce(): void {
  const command = takeUndoCommand();
  expect(command).not.toBeNull();
  applyUndoableCommand(command!, 'undo');
}

function redoOnce(): void {
  const command = takeRedoCommand();
  expect(command).not.toBeNull();
  applyUndoableCommand(command!, 'redo');
}

describe('createScene undo (US-37)', () => {
  beforeEach(() => {
    clearSelection();
    clearUndoStack();
    $model.set({
      models: [],
      activeModelId: null,
      previewModelIds: [],
      phase: 'idle',
      error: null,
    });
  });

  it('deletes a selected create group and its children', () => {
    const scene = new Group();
    const group = createEmptyPartGroup(scene, { name: 'group' });
    const child = createPart('child');
    group.add(child);
    setCreatedModel(scene);

    selectObject(group);
    deleteSelectedPart();

    expect(scene.children).toHaveLength(0);
    expect(group.parent).toBeNull();
    expect(isCreateGroup(group)).toBe(true);
  });

  it('deletes multi-select roots in one undo entry', () => {
    const scene = new Group();
    const a = createPart('a');
    const b = createPart('b');
    scene.add(a, b);
    setCreatedModel(scene);

    selectParts([a, b]);
    deleteSelectedPart();

    expect(scene.children).toHaveLength(0);

    undoOnce();
    expect(scene.getObjectByProperty('uuid', a.uuid)).toBeTruthy();
    expect(scene.getObjectByProperty('uuid', b.uuid)).toBeTruthy();

    redoOnce();
    expect(scene.children).toHaveLength(0);
  });

  it('undoes delete of a part nested under a group', () => {
    const scene = new Group();
    const group = createEmptyPartGroup(scene, { name: 'group' });
    const child = createPart('child');
    child.position.set(1, 2, 3);
    group.add(child);
    setCreatedModel(scene);

    const childUuid = child.uuid;
    const groupUuid = group.uuid;

    selectObject(child);
    deleteSelectedPart();

    expect(group.children).toHaveLength(0);

    undoOnce();
    const restored = scene.getObjectByProperty('uuid', childUuid);
    expect(restored).toBeTruthy();
    expect(restored?.parent?.uuid).toBe(groupUuid);
    expect(restored?.position.toArray()).toEqual([1, 2, 3]);
  });

  it('undoes addPart and removes the inserted mesh', () => {
    const scene = new Group();
    setCreatedModel(scene);

    const mesh = addPart('model-1', 'box');
    expect(mesh).not.toBeNull();
    expect(scene.children).toHaveLength(1);
    const uuid = mesh!.uuid;

    undoOnce();
    expect(scene.getObjectByProperty('uuid', uuid)).toBeUndefined();
    expect(scene.children).toHaveLength(0);

    redoOnce();
    const restored = scene.getObjectByProperty('uuid', uuid);
    expect(restored).toBeTruthy();
    expect(isCreateGroup(restored!)).toBe(false);
  });
});
