import { Bone, SkinnedMesh, Vector3 } from 'three';
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

  it('orients limb bones so Mixamo-style local +Y points at the chain child', () => {
    const scene = buildRigidSkinnedSceneFromKit(BLOCK_ROBOT_MESH_RECIPE);
    scene.updateMatrixWorld(true);

    const byName = new Map<string, Bone>();
    scene.traverse((object) => {
      if (object instanceof Bone) {
        byName.set(object.name, object);
      }
    });

    const forearm = byName.get('LeftForeArm');
    const hand = byName.get('LeftHand');
    const leg = byName.get('LeftLeg');
    expect(forearm && hand && leg).toBeTruthy();
    if (!forearm || !hand || !leg) {
      return;
    }

    // Child sits on parent local +Y (Mixamo rest), not along world ±X.
    expect(Math.abs(hand.position.x)).toBeLessThan(1e-4);
    expect(Math.abs(hand.position.z)).toBeLessThan(1e-4);
    expect(hand.position.y).toBeGreaterThan(0.2);

    expect(Math.abs(leg.position.x)).toBeLessThan(1e-4);
    expect(Math.abs(leg.position.z)).toBeLessThan(1e-4);
    expect(leg.position.y).toBeGreaterThan(0.3);

    const localYWorld = new Vector3(0, 1, 0).transformDirection(forearm.matrixWorld);
    const forearmPos = new Vector3();
    const handPos = new Vector3();
    forearm.getWorldPosition(forearmPos);
    hand.getWorldPosition(handPos);
    const toHand = handPos.sub(forearmPos).normalize();
    expect(localYWorld.dot(toHand)).toBeGreaterThan(0.99);
  });
});
