import type { ModelEntry } from '@/modules/viewport/types/model';
import type { SelectionState } from '@/modules/viewport/types/selection';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateGroup } from '@/modules/create/domain/hierarchy/group-data';
import {
  resolveSelectedCreateRoots,
  selectedCreateHierarchyUuids,
} from '@/modules/create/domain/hierarchy/selected-create-roots';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { EMPTY_SELECTION } from '@/modules/viewport/types/selection';

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
  writeCreateGroup(group);
  return group;
}

function createdModel(scene: Group): ModelEntry {
  return {
    id: 'created-1',
    fileName: 'body',
    scene,
    source: 'created',
  };
}

function partsSelection(objects: Object3D[]): SelectionState {
  return {
    object: objects[objects.length - 1] ?? null,
    objects,
    modelIds: [],
    kind: 'parts',
  };
}

describe('selectedCreateHierarchyUuids', () => {
  it('returns only create hierarchy node uuids', () => {
    const part = createPart('box');
    const plain = new Object3D();
    expect(selectedCreateHierarchyUuids([part, plain])).toEqual([part.uuid]);
  });
});

describe('resolveSelectedCreateRoots', () => {
  it('returns null when focus is missing or not a created model', () => {
    const scene = new Group();
    const part = createPart('box');
    scene.add(part);
    const selection = partsSelection([part]);

    expect(resolveSelectedCreateRoots(null, selection)).toBeNull();
    expect(
      resolveSelectedCreateRoots(
        { ...createdModel(scene), source: 'imported' },
        selection,
      ),
    ).toBeNull();
  });

  it('returns null when selection is empty or not parts', () => {
    const scene = new Group();
    const model = createdModel(scene);
    expect(resolveSelectedCreateRoots(model, EMPTY_SELECTION)).toBeNull();
    expect(
      resolveSelectedCreateRoots(model, {
        object: null,
        objects: [],
        modelIds: [model.id],
        kind: 'models',
      }),
    ).toBeNull();
  });

  it('keeps parent as the sole root when parent and child are selected', () => {
    const scene = new Group();
    const parent = createPart('parent');
    const child = createPart('child');
    parent.add(child);
    scene.add(parent);
    const model = createdModel(scene);

    const result = resolveSelectedCreateRoots(
      model,
      partsSelection([parent, child]),
    );
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe(model.id);
    expect(result!.partsRoot).toBe(scene);
    expect(result!.roots).toEqual([parent]);
    expect(result!.selectUuids).toEqual([parent.uuid, child.uuid]);
  });

  it('keeps unrelated siblings as separate roots', () => {
    const scene = new Group();
    const a = createPart('a');
    const b = createGroup('b');
    scene.add(a, b);
    const model = createdModel(scene);

    const result = resolveSelectedCreateRoots(model, partsSelection([a, b]));
    expect(result!.roots).toEqual([a, b]);
    expect(result!.selectUuids).toEqual([a.uuid, b.uuid]);
  });

  it('ignores hierarchy nodes outside the focused model scene', () => {
    const scene = new Group();
    const elsewhere = new Group();
    const local = createPart('local');
    const foreign = createPart('foreign');
    scene.add(local);
    elsewhere.add(foreign);
    const model = createdModel(scene);

    const result = resolveSelectedCreateRoots(
      model,
      partsSelection([local, foreign]),
    );
    expect(result!.roots).toEqual([local]);
    expect(result!.selectUuids).toEqual([local.uuid]);
  });
});
