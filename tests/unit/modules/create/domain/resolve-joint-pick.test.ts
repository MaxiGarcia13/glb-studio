import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateGroup, writeCreateJoint } from '@/modules/create/domain/hierarchy/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import {
  resolveJointPickTarget,
  resolveShiftCreatePartPick,
} from '@/modules/create/domain/resolve-joint-pick';

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

function createJoint(name: string): Group {
  const joint = new Group();
  joint.name = name;
  writeCreateJoint(joint);
  return joint;
}

describe('resolveJointPickTarget', () => {
  it('returns the picked object when it is not a create part', () => {
    const group = createGroup('Hips');
    expect(resolveJointPickTarget(group)).toBe(group);
  });

  it('returns the part when it has no create-group ancestor', () => {
    const root = new Group();
    const part = createPart('box');
    root.add(part);
    expect(resolveJointPickTarget(part)).toBe(part);
  });

  it('promotes a part to its nearest create-group', () => {
    const hips = createGroup('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveJointPickTarget(part)).toBe(hips);
  });

  it('promotes to a joint the same as a plain group', () => {
    const hips = createJoint('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveJointPickTarget(part)).toBe(hips);
  });

  it('drills into the part when the nearest group is already selected', () => {
    const hips = createGroup('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveJointPickTarget(part, [hips])).toBe(part);
  });

  it('uses the nearest group, not an outer ancestor', () => {
    const armature = createGroup('Armature');
    const hips = createGroup('Hips');
    const part = createPart('box');
    armature.add(hips);
    hips.add(part);
    expect(resolveJointPickTarget(part)).toBe(hips);
    expect(resolveJointPickTarget(part, [armature])).toBe(hips);
    expect(resolveJointPickTarget(part, [hips])).toBe(part);
  });
});

describe('resolveShiftCreatePartPick', () => {
  it('toggles the nearest group on the first pick', () => {
    const hips = createGroup('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveShiftCreatePartPick(part, [])).toEqual({
      type: 'toggle',
      object: hips,
    });
  });

  it('replaces the group with the part when the group is selected', () => {
    const hips = createGroup('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveShiftCreatePartPick(part, [hips])).toEqual({
      type: 'replace',
      from: hips,
      to: part,
    });
  });

  it('toggles the part off when the part is already selected', () => {
    const hips = createGroup('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveShiftCreatePartPick(part, [part])).toEqual({
      type: 'toggle',
      object: part,
    });
  });

  it('prefers part toggle over replace when both group and part are selected', () => {
    const hips = createGroup('Hips');
    const part = createPart('box');
    hips.add(part);
    expect(resolveShiftCreatePartPick(part, [hips, part])).toEqual({
      type: 'toggle',
      object: part,
    });
  });

  it('toggles a part with no group ancestor as itself', () => {
    const root = new Group();
    const part = createPart('box');
    root.add(part);
    expect(resolveShiftCreatePartPick(part, [])).toEqual({
      type: 'toggle',
      object: part,
    });
  });
});
