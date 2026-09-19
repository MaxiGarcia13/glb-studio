import {
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Skeleton,
  SkinnedMesh,
} from 'three';
import { describe, expect, it } from 'vitest';

import {
  isUsableCreatedModelScene,
  isUsableSkinnedModelScene,
} from '@/modules/import/domain/model-scene-kind';

describe('isUsableSkinnedModelScene', () => {
  it('requires a SkinnedMesh with a skeleton', () => {
    const empty = new Group();
    expect(isUsableSkinnedModelScene(empty)).toBe(false);

    const bone = new Bone();
    const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    skinned.add(bone);
    skinned.bind(new Skeleton([bone]));
    const scene = new Group();
    scene.add(skinned);

    expect(isUsableSkinnedModelScene(scene)).toBe(true);
  });

  it('rejects a SkinnedMesh without a skeleton', () => {
    const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    const scene = new Group();
    scene.add(skinned);
    expect(isUsableSkinnedModelScene(scene)).toBe(false);
  });

  it('rejects plain meshes', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
    expect(isUsableSkinnedModelScene(scene)).toBe(false);
  });
});

describe('isUsableCreatedModelScene', () => {
  it('accepts a scene with at least one non-skinned mesh', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
    expect(isUsableCreatedModelScene(scene)).toBe(true);
  });

  it('rejects empty scenes and skinned-only scenes', () => {
    expect(isUsableCreatedModelScene(new Group())).toBe(false);

    const bone = new Bone();
    const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    skinned.add(bone);
    skinned.bind(new Skeleton([bone]));
    const scene = new Group();
    scene.add(skinned);
    expect(isUsableCreatedModelScene(scene)).toBe(false);
  });
});
