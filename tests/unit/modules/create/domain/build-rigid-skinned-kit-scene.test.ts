import { Bone, SkinnedMesh } from 'three';
import { describe, expect, it } from 'vitest';

import { buildRigidSkinnedSceneFromKit } from '@/modules/create/domain/build-rigid-skinned-kit-scene';
import { BLOCK_ROBOT_MESH_RECIPE } from '@/modules/create/domain/kits/block-robot';

describe('buildRigidSkinnedSceneFromKit', () => {
  it('builds an Armature with 52 Mixamo-matching bones and rigid skinned meshes for Block robot', () => {
    const scene = buildRigidSkinnedSceneFromKit(BLOCK_ROBOT_MESH_RECIPE);

    const bones: string[] = [];
    let skinnedMeshes = 0;
    let armature = false;

    scene.traverse((object) => {
      if (object.name === 'Armature') {
        armature = true;
      }
      if (object instanceof Bone) {
        bones.push(object.name);
      }
      if (object instanceof SkinnedMesh) {
        skinnedMeshes += 1;
        const index = object.geometry.getAttribute('skinIndex');
        const weight = object.geometry.getAttribute('skinWeight');
        expect(index).toBeTruthy();
        expect(weight).toBeTruthy();
        expect(weight.getX(0)).toBe(1);
      }
    });

    expect(armature).toBe(true);
    expect(bones).toHaveLength(52);
    expect(bones).toContain('Hips');
    expect(bones).toContain('UpperChest');
    expect(bones).toContain('LeftShoulder');
    expect(bones).toContain('RightHandIndex1');
    expect(bones).toContain('LeftToeBase');
    expect(skinnedMeshes).toBe(BLOCK_ROBOT_MESH_RECIPE.parts.length);
  });
});
