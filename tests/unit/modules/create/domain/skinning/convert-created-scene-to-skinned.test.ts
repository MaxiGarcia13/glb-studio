import { Bone, BoxGeometry, Group, Mesh, MeshStandardMaterial, SkinnedMesh } from 'three';
import { describe, expect, it } from 'vitest';

import { writeCreateJoint } from '@/modules/create/domain/hierarchy/group-data';
import { writeCreatePart } from '@/modules/create/domain/part-data';
import { convertCreatedSceneToSkinned } from '@/modules/create/domain/skinning/convert-created-scene-to-skinned';
import { isUsableSkinnedModelScene } from '@/modules/import/domain/model-scene-kind';

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
  writeCreateJoint(group);
  return group;
}

describe('convertCreatedSceneToSkinned', () => {
  it('builds a usable skinned scene from create groups + parts', () => {
    const scene = new Group();
    scene.name = 'Hero';
    const hips = createGroup('Hips');
    const spine = createGroup('Spine');
    hips.position.set(0, 1, 0);
    spine.position.set(0, 0.5, 0);
    scene.add(hips);
    hips.add(createPart('torso'), spine);
    spine.add(createPart('chest'));

    const skinned = convertCreatedSceneToSkinned(scene);

    expect(skinned.name).toBe('Hero');
    expect(isUsableSkinnedModelScene(skinned)).toBe(true);

    const bones: string[] = [];
    let skinnedMeshes = 0;
    skinned.traverse((object) => {
      if (object instanceof Bone) {
        bones.push(object.name);
      }
      if (object instanceof SkinnedMesh) {
        skinnedMeshes += 1;
      }
    });

    expect(bones).toEqual(['Hips', 'Spine']);
    expect(skinnedMeshes).toBe(2);
    // Source scene unchanged.
    expect(scene.children).toHaveLength(1);
  });

  it('parents bones under Armature when present', () => {
    const scene = new Group();
    const armature = createGroup('Armature');
    const hips = createGroup('Hips');
    hips.position.set(0, 1, 0);
    scene.add(armature);
    armature.add(hips);
    hips.add(createPart('torso'));

    const skinned = convertCreatedSceneToSkinned(scene);
    const hipsBone = skinned.getObjectByName('Hips');
    const armatureNode = skinned.getObjectByName('Armature');

    expect(armatureNode).toBeTruthy();
    expect(hipsBone?.parent).toBe(armatureNode);
    expect(isUsableSkinnedModelScene(skinned)).toBe(true);
  });
});
