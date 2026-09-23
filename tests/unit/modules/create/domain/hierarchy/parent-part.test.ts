import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateGroup } from '@/modules/create/domain/hierarchy/group-data';
import {
  canAttachUnder,
  isStrictDescendantOf,
  resolveHierarchyRoots,
} from '@/modules/create/domain/hierarchy/parent-part';
import { writeCreatePart } from '@/modules/create/domain/part-data';

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

describe('isStrictDescendantOf', () => {
  it('is true for a direct child and a deeper descendant', () => {
    const parent = new Object3D();
    const child = new Object3D();
    const grandchild = new Object3D();
    parent.add(child);
    child.add(grandchild);

    expect(isStrictDescendantOf(child, parent)).toBe(true);
    expect(isStrictDescendantOf(grandchild, parent)).toBe(true);
  });

  it('is false for self, an ancestor, or an unrelated node', () => {
    const parent = new Object3D();
    const child = new Object3D();
    const sibling = new Object3D();
    parent.add(child);
    parent.add(sibling);

    expect(isStrictDescendantOf(parent, parent)).toBe(false);
    expect(isStrictDescendantOf(parent, child)).toBe(false);
    expect(isStrictDescendantOf(sibling, child)).toBe(false);
  });
});

describe('resolveHierarchyRoots', () => {
  it('drops the child when parent and child are both selected', () => {
    const parent = new Object3D();
    const child = new Object3D();
    parent.add(child);

    expect(resolveHierarchyRoots([parent, child])).toEqual([parent]);
  });

  it('keeps unrelated siblings', () => {
    const root = new Object3D();
    const a = new Object3D();
    const b = new Object3D();
    root.add(a, b);

    expect(resolveHierarchyRoots([a, b])).toEqual([a, b]);
  });

  it('drops a deep descendant when an ancestor is selected', () => {
    const parent = new Object3D();
    const mid = new Object3D();
    const leaf = new Object3D();
    parent.add(mid);
    mid.add(leaf);

    expect(resolveHierarchyRoots([parent, leaf])).toEqual([parent]);
  });

  it('returns a single node and an empty selection unchanged', () => {
    const alone = new Object3D();
    expect(resolveHierarchyRoots([alone])).toEqual([alone]);
    expect(resolveHierarchyRoots([])).toEqual([]);
  });
});

describe('canAttachUnder', () => {
  it('allows attaching a part under the parts root', () => {
    const partsRoot = new Group();
    const child = createPart('box');
    partsRoot.add(child);

    expect(canAttachUnder(child, partsRoot, partsRoot)).toBe(true);
  });

  it('allows attaching a part under another create part or group', () => {
    const partsRoot = new Group();
    const parent = createPart('parent');
    const group = createGroup('group');
    const child = createPart('child');
    partsRoot.add(parent, group, child);

    expect(canAttachUnder(child, parent, partsRoot)).toBe(true);
    expect(canAttachUnder(child, group, partsRoot)).toBe(true);
  });

  it('rejects a non-create hierarchy child', () => {
    const partsRoot = new Group();
    const plain = new Object3D();
    partsRoot.add(plain);

    expect(canAttachUnder(plain, partsRoot, partsRoot)).toBe(false);
  });

  it('rejects a child outside the parts root', () => {
    const partsRoot = new Group();
    const elsewhere = new Group();
    const child = createPart('orphan');
    elsewhere.add(child);

    expect(canAttachUnder(child, partsRoot, partsRoot)).toBe(false);
  });

  it('rejects a parent that is not the root and not a create hierarchy node', () => {
    const partsRoot = new Group();
    const plainParent = new Object3D();
    const child = createPart('box');
    partsRoot.add(plainParent, child);

    expect(canAttachUnder(child, plainParent, partsRoot)).toBe(false);
  });

  it('rejects attaching a node to itself', () => {
    const partsRoot = new Group();
    const child = createPart('box');
    partsRoot.add(child);

    expect(canAttachUnder(child, child, partsRoot)).toBe(false);
  });

  it('rejects a cycle (parent is a descendant of child)', () => {
    const partsRoot = new Group();
    const parent = createPart('parent');
    const child = createPart('child');
    partsRoot.add(parent);
    parent.add(child);

    // child is already under parent — attaching parent under child would cycle
    expect(canAttachUnder(parent, child, partsRoot)).toBe(false);
  });
});
