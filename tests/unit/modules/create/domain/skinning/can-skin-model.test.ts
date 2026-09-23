import type { ModelEntry } from '@/modules/viewport/types/model';
import {
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
} from 'three';

import { describe, expect, it } from 'vitest';

import { ARMATURE_GROUP_NAME } from '@/modules/create/constants/armature';
import {
  writeCreateGroup,
  writeCreateJoint,
} from '@/modules/create/domain/hierarchy/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { canSkinModel } from '@/modules/create/domain/skinning/can-skin-model';

function createPart(name: string): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name;
  writeCreatePart(mesh, {
    kind: 'box',
    params: { width: 1, height: 1, depth: 1 },
  });
  return mesh;
}

function createJoint(name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateJoint(group);
  return group;
}

function createPlainGroup(name: string): Group {
  const group = new Group();
  group.name = name;
  writeCreateGroup(group);
  return group;
}

function model(partial: Pick<ModelEntry, 'source' | 'scene'> & { id?: string }): ModelEntry {
  return {
    id: partial.id ?? 'model-1',
    fileName: 'model.glb',
    source: partial.source,
    scene: partial.scene,
  };
}

describe('canSkinModel', () => {
  it('enables when created model has joints and parts', () => {
    const scene = new Group();
    const hips = createJoint('Hips');
    hips.add(createPart('torso'));
    scene.add(hips);

    expect(canSkinModel(model({ source: 'created', scene }))).toEqual({
      enabled: true,
      reason: 'Convert joints into a skeleton',
    });
  });

  it('disables when only plain groups exist (no joints)', () => {
    const scene = new Group();
    const bundle = createPlainGroup('group');
    bundle.add(createPart('box'));
    scene.add(bundle);

    expect(canSkinModel(model({ source: 'created', scene }))).toEqual({
      enabled: false,
      reason: 'Add joints before skinning',
    });
  });

  it('disables imported models without a skeleton', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));

    expect(canSkinModel(model({ source: 'imported', scene }))).toEqual({
      enabled: false,
      reason: 'Skin works on created models',
    });
  });

  it('disables when already skinned', () => {
    const scene = new Group();
    const bone = new Bone();
    bone.name = 'Hips';
    const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    skinned.bind(new Skeleton([bone]));
    scene.add(bone, skinned);

    expect(canSkinModel(model({ source: 'imported', scene }))).toEqual({
      enabled: false,
      reason: 'Already skinned',
    });
  });

  it('disables created models with no joints', () => {
    const scene = new Group();
    scene.add(createPart('box'));

    expect(canSkinModel(model({ source: 'created', scene }))).toEqual({
      enabled: false,
      reason: 'Add joints before skinning',
    });
  });

  it('disables created models with joints but no parts', () => {
    const scene = new Group();
    scene.add(createJoint('Hips'));

    expect(canSkinModel(model({ source: 'created', scene }))).toEqual({
      enabled: false,
      reason: 'Add parts before skinning',
    });
  });

  it('disables empty created models', () => {
    const scene = new Group();

    expect(canSkinModel(model({ source: 'created', scene }))).toEqual({
      enabled: false,
      reason: 'Add joints before skinning',
    });
  });

  it('disables when only an Armature joint exists', () => {
    const scene = new Group();
    const armature = createJoint(ARMATURE_GROUP_NAME);
    armature.add(createPart('box'));
    scene.add(armature);

    expect(canSkinModel(model({ source: 'created', scene }))).toEqual({
      enabled: false,
      reason: 'Add joints before skinning',
    });
  });
});
