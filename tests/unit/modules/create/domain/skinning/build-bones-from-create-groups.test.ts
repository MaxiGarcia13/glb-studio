import { Bone, Group, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateGroup, writeCreateJoint } from '@/modules/create/domain/hierarchy/group-data';
import { ARMATURE_GROUP_NAME } from '@/modules/create/constants/armature';
import {
  buildBonesFromCreateGroups,
} from '@/modules/create/domain/skinning/build-bones-from-create-groups';

function createGroup(name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateJoint(group);
  return group;
}

describe('buildBonesFromCreateGroups', () => {
  it('builds a name-stable bone tree matching create-group parents', () => {
    const scene = new Group();
    const hips = createGroup('Hips');
    const spine = createGroup('Spine');
    const chest = createGroup('Chest');
    hips.position.set(0, 1, 0);
    spine.position.set(0, 0.5, 0);
    chest.position.set(0, 0.4, 0);
    scene.add(hips);
    hips.add(spine);
    spine.add(chest);
    scene.updateMatrixWorld(true);

    const { bones, armature, groupToNode } = buildBonesFromCreateGroups(scene);

    expect(armature).toBeNull();
    expect(bones.map((bone) => bone.name)).toEqual(['Hips', 'Spine', 'Chest']);
    expect(groupToNode.get(hips)).toBe(bones[0]);
    expect(bones[1]!.parent).toBe(bones[0]);
    expect(bones[2]!.parent).toBe(bones[1]);

    bones[0]!.updateWorldMatrix(true, true);
    expect(bones[0]!.getWorldPosition(new Vector3()).y).toBeCloseTo(1);
    expect(bones[1]!.getWorldPosition(new Vector3()).y).toBeCloseTo(1.5);
    expect(bones[2]!.getWorldPosition(new Vector3()).y).toBeCloseTo(1.9);
  });

  it('treats Armature as a container group, not a skeleton bone', () => {
    const scene = new Group();
    const armatureGroup = createGroup(ARMATURE_GROUP_NAME);
    const hips = createGroup('Hips');
    hips.position.set(0, 1, 0);
    scene.add(armatureGroup);
    armatureGroup.add(hips);
    scene.updateMatrixWorld(true);

    const { bones, armature, groupToNode } = buildBonesFromCreateGroups(scene);

    expect(bones).toHaveLength(1);
    expect(bones[0]!.name).toBe('Hips');
    expect(armature).toBeInstanceOf(Group);
    expect(armature!.name).toBe(ARMATURE_GROUP_NAME);
    expect(armature).not.toBeInstanceOf(Bone);
    expect(groupToNode.get(armatureGroup)).toBe(armature);
    expect(bones[0]!.parent).toBe(armature);
  });

  it('parents orphan bones under Armature when present', () => {
    const scene = new Group();
    const armatureGroup = createGroup(ARMATURE_GROUP_NAME);
    const hips = createGroup('Hips');
    const prop = createGroup('Prop');
    hips.position.set(0, 1, 0);
    prop.position.set(2, 0, 0);
    scene.add(armatureGroup, hips, prop);
    armatureGroup.add(hips);
    scene.updateMatrixWorld(true);

    const { bones, armature } = buildBonesFromCreateGroups(scene);
    const hipsBone = bones.find((bone) => bone.name === 'Hips');
    const propBone = bones.find((bone) => bone.name === 'Prop');

    expect(hipsBone!.parent).toBe(armature);
    expect(propBone!.parent).toBe(armature);
  });

  it('throws when there are no joints', () => {
    expect(() => buildBonesFromCreateGroups(new Group())).toThrow(
      /No joints/,
    );
  });

  it('throws when only Armature exists', () => {
    const scene = new Group();
    scene.add(createGroup(ARMATURE_GROUP_NAME));

    expect(() => buildBonesFromCreateGroups(scene)).toThrow(/No bones produced/);
  });

  it('skips plain organizational groups when building bones', () => {
    const scene = new Group();
    const hips = createGroup('Hips');
    const bag = new Group();
    bag.name = 'Extras';
    writeCreateGroup(bag);
    hips.add(bag);
    scene.add(hips);

    const { bones } = buildBonesFromCreateGroups(scene);
    expect(bones.map((bone) => bone.name)).toEqual(['Hips']);
  });
});
