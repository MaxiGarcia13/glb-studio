import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateGroup } from '@/modules/create/domain/group-data';
import { canAttachUnder } from '@/modules/create/domain/parent-part';
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
