import { Bone, Matrix4, Quaternion, SkinnedMesh, Vector3 } from 'three';
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

  it('aims Foot +Y down-forward like Mixamo so rest-pose quats keep soles flat', () => {
    const scene = buildRigidSkinnedSceneFromKit(BLOCK_ROBOT_MESH_RECIPE);
    scene.updateMatrixWorld(true);

    const byName = new Map<string, Bone>();
    scene.traverse((object) => {
      if (object instanceof Bone) {
        byName.set(object.name, object);
      }
    });

    const leftFoot = byName.get('LeftFoot');
    const rightFoot = byName.get('RightFoot');
    expect(leftFoot && rightFoot).toBeTruthy();
    if (!leftFoot || !rightFoot) {
      return;
    }

    const y = new Vector3(0, 1, 0).transformDirection(leftFoot.matrixWorld);
    // body-block LeftFoot +Y ≈ (0.05, -0.52, 0.85)
    expect(y.y).toBeLessThan(-0.4);
    expect(y.z).toBeGreaterThan(0.7);
    expect(Math.abs(y.x)).toBeLessThan(0.15);

    const x = new Vector3(1, 0, 0).transformDirection(leftFoot.matrixWorld);
    expect(x.x).toBeCloseTo(-1, 1);
    expect(Math.abs(x.y)).toBeLessThan(0.2);
    expect(Math.abs(x.z)).toBeLessThan(0.2);

    const footMesh = scene.getObjectByName('foot_left');
    expect(footMesh).toBeInstanceOf(SkinnedMesh);
    if (!(footMesh instanceof SkinnedMesh)) {
      return;
    }
    const boneIndex = footMesh.skeleton.bones.indexOf(leftFoot);
    const inverse = footMesh.skeleton.boneInverses[boneIndex];
    const skinPoint = (point: Vector3): Vector3 => {
      const matrix = new Matrix4().multiplyMatrices(leftFoot.matrixWorld, inverse);
      return point.clone().applyMatrix4(matrix);
    };

    // Mixamo body-block clip t0 — copied onto a matching bind, the box stays
    // near the grid instead of pitching into the floor.
    const mixamoFootT0 = new Quaternion(0.5598, -0.0518, -0.0689, 0.8241);
    const bindQuat = leftFoot.quaternion.clone();
    leftFoot.quaternion.copy(mixamoFootT0);
    leftFoot.updateMatrixWorld(true);
    const heel = skinPoint(new Vector3(0.1, 0, 0));
    const toe = skinPoint(new Vector3(0.1, 0, 0.16));
    expect(heel.y).toBeGreaterThan(-0.02);
    expect(toe.y).toBeGreaterThan(-0.02);
    expect(toe.clone().sub(heel).normalize().z).toBeGreaterThan(0.95);
    leftFoot.quaternion.copy(bindQuat);
    leftFoot.updateMatrixWorld(true);

    const rightY = new Vector3(0, 1, 0).transformDirection(rightFoot.matrixWorld);
    expect(rightY.y).toBeLessThan(-0.4);
    expect(rightY.z).toBeGreaterThan(0.7);
  });
});
