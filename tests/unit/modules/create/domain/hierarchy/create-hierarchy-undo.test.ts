import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

import { applyUndoableCommand } from '@/modules/animation/stores/clip-store/actions/apply-undoable-command';
import {
  $commandStack,
  clearUndoStack,
  takeRedoCommand,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import { groupSelectedParts } from '@/modules/create/actions/group-selected-parts';
import { makeJointSelectedParts } from '@/modules/create/actions/make-joint-selected-parts';
import { ungroupSelectedParts } from '@/modules/create/actions/ungroup-selected-parts';
import { createEmptyPartGroup } from '@/modules/create/domain/hierarchy/create-part-group';
import { isCreateJoint, isCreatePlainGroup } from '@/modules/create/domain/hierarchy/group-data';
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

function selectParts(objects: Mesh[]): void {
  $selection.set({
    object: objects[objects.length - 1] ?? null,
    objects,
    modelIds: [],
    kind: 'parts',
  });
}

function worldPos(object: Mesh | Group): Vector3 {
  const result = new Vector3();
  object.getWorldPosition(result);
  return result;
}

describe('create hierarchy undo', () => {
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

  it('undoes Group and restores parents + world positions', () => {
    const scene = new Group();
    const a = createPart('a');
    const b = createPart('b');
    a.position.set(1, 0, 0);
    b.position.set(3, 0, 0);
    scene.add(a, b);
    scene.updateMatrixWorld(true);
    setCreatedModel(scene);

    const beforeA = worldPos(a).clone();
    const beforeB = worldPos(b).clone();
    selectParts([a, b]);

    expect(groupSelectedParts()).toBe(true);
    expect(a.parent).not.toBe(scene);
    expect(isCreatePlainGroup(a.parent!)).toBe(true);
    expect($commandStack.get().past).toHaveLength(1);

    const command = takeUndoCommand();
    expect(command?.id).toBe('createHierarchy');
    if (!command || command.id !== 'createHierarchy') {
      throw new Error('expected createHierarchy');
    }
    applyUndoableCommand(command, 'undo');

    expect(a.parent).toBe(scene);
    expect(b.parent).toBe(scene);
    expect(worldPos(a).distanceTo(beforeA)).toBeLessThan(1e-6);
    expect(worldPos(b).distanceTo(beforeB)).toBeLessThan(1e-6);
    expect(scene.children.some((child) => isCreatePlainGroup(child))).toBe(false);
  });

  it('redoes Group with the same group uuid', () => {
    const scene = new Group();
    const a = createPart('a');
    const b = createPart('b');
    scene.add(a, b);
    setCreatedModel(scene);
    selectParts([a, b]);

    expect(groupSelectedParts()).toBe(true);
    const groupUuid = a.parent!.uuid;

    const undo = takeUndoCommand();
    expect(undo).not.toBeNull();
    applyUndoableCommand(undo!, 'undo');

    const redo = takeRedoCommand();
    expect(redo).not.toBeNull();
    applyUndoableCommand(redo!, 'redo');

    expect(a.parent?.uuid).toBe(groupUuid);
    expect(b.parent?.uuid).toBe(groupUuid);
  });

  it('undoes Ungroup and recreates the dissolved group', () => {
    const scene = new Group();
    const group = createEmptyPartGroup(scene, { name: 'g1', role: 'group' });
    const a = createPart('a');
    const b = createPart('b');
    group.add(a, b);
    setCreatedModel(scene);
    selectObject(group);

    const groupUuid = group.uuid;
    expect(ungroupSelectedParts()).toBe(true);
    expect(a.parent).toBe(scene);
    expect(scene.getObjectByProperty('uuid', groupUuid)).toBeUndefined();

    const command = takeUndoCommand();
    expect(command?.id).toBe('createHierarchy');
    applyUndoableCommand(command!, 'undo');

    const restored = scene.getObjectByProperty('uuid', groupUuid);
    expect(restored).toBeTruthy();
    expect(isCreatePlainGroup(restored!)).toBe(true);
    expect(a.parent).toBe(restored);
    expect(b.parent).toBe(restored);
  });

  it('pose then group: undo group first does not teleport parts', () => {
    const scene = new Group();
    const a = createPart('a');
    const b = createPart('b');
    a.position.set(2, 0, 0);
    b.position.set(4, 0, 0);
    scene.add(a, b);
    scene.updateMatrixWorld(true);
    setCreatedModel(scene);

    // Simulate a prior pose commit under the scene root (local TRS snapshot).
    const posedLocal = a.position.clone();
    const beforeGroupWorld = worldPos(a).clone();

    selectParts([a, b]);
    expect(groupSelectedParts()).toBe(true);

    // Undoing group must restore root parenting + original local (not leave
    // pre-group local under the group parent).
    const command = takeUndoCommand();
    applyUndoableCommand(command!, 'undo');

    expect(a.parent).toBe(scene);
    expect(a.position.x).toBeCloseTo(posedLocal.x);
    expect(worldPos(a).distanceTo(beforeGroupWorld)).toBeLessThan(1e-6);
  });

  it('undoes Make connector and restores part parents', () => {
    const scene = new Group();
    const thigh = createPart('thigh');
    const shin = createPart('shin');
    thigh.position.set(0, 4, 0);
    shin.position.set(0, 2, 0);
    scene.add(thigh, shin);
    scene.updateMatrixWorld(true);
    setCreatedModel(scene);
    selectParts([thigh, shin]);

    expect(
      makeJointSelectedParts({
        connectors: [{ name: 'knee', source: { kind: 'new' } }],
      }),
    ).toBe(true);

    expect(isCreateJoint(thigh.parent!) || isCreateJoint(shin.parent!)).toBe(true);
    const command = takeUndoCommand();
    expect(command?.id).toBe('createHierarchy');
    applyUndoableCommand(command!, 'undo');

    expect(thigh.parent).toBe(scene);
    expect(shin.parent).toBe(scene);
    expect(listJoints(scene)).toHaveLength(0);
  });
});

function listJoints(root: Group): Group[] {
  const joints: Group[] = [];
  root.traverse((object) => {
    if (object !== root && isCreateJoint(object)) {
      joints.push(object as Group);
    }
  });
  return joints;
}
