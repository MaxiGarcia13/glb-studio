import { Bone, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { orientSkeletonMixamoAxes } from '@/modules/create/domain/orient-skeleton-mixamo-axes';

describe('orientSkeletonMixamoAxes', () => {
  it('puts the chain child on local +Y while keeping world positions', () => {
    const hips = new Bone();
    hips.name = 'Hips';
    hips.position.set(0, 1, 0);

    const spine = new Bone();
    spine.name = 'Spine';
    // Local offset up from hips.
    spine.position.set(0, 0.1, 0);

    const leftArm = new Bone();
    leftArm.name = 'LeftArm';
    leftArm.position.set(0.2, 0.4, 0);

    const leftForeArm = new Bone();
    leftForeArm.name = 'LeftForeArm';
    // Along world +X from the arm (Mixamo left).
    leftForeArm.position.set(0.3, 0, 0);

    const leftHand = new Bone();
    leftHand.name = 'LeftHand';
    leftHand.position.set(0.25, 0, 0);

    hips.add(spine);
    hips.add(leftArm);
    leftArm.add(leftForeArm);
    leftForeArm.add(leftHand);
    hips.updateMatrixWorld(true);

    const beforeArm = new Vector3();
    const beforeFore = new Vector3();
    const beforeHand = new Vector3();
    leftArm.getWorldPosition(beforeArm);
    leftForeArm.getWorldPosition(beforeFore);
    leftHand.getWorldPosition(beforeHand);

    orientSkeletonMixamoAxes([hips, spine, leftArm, leftForeArm, leftHand]);
    hips.updateMatrixWorld(true);

    const afterArm = new Vector3();
    const afterFore = new Vector3();
    const afterHand = new Vector3();
    leftArm.getWorldPosition(afterArm);
    leftForeArm.getWorldPosition(afterFore);
    leftHand.getWorldPosition(afterHand);

    expect(afterArm.distanceTo(beforeArm)).toBeLessThan(1e-6);
    expect(afterFore.distanceTo(beforeFore)).toBeLessThan(1e-6);
    expect(afterHand.distanceTo(beforeHand)).toBeLessThan(1e-6);

    expect(Math.abs(leftForeArm.position.x)).toBeLessThan(1e-4);
    expect(Math.abs(leftForeArm.position.z)).toBeLessThan(1e-4);
    expect(leftForeArm.position.y).toBeCloseTo(0.3, 4);

    expect(Math.abs(leftHand.position.x)).toBeLessThan(1e-4);
    expect(Math.abs(leftHand.position.z)).toBeLessThan(1e-4);
    expect(leftHand.position.y).toBeCloseTo(0.25, 4);

    expect(Math.abs(spine.position.x)).toBeLessThan(1e-4);
    expect(Math.abs(spine.position.z)).toBeLessThan(1e-4);
    expect(spine.position.y).toBeCloseTo(0.1, 4);
  });

  it('twists LeftFoot so local +X matches Mixamo (−world X)', () => {
    const hips = new Bone();
    hips.name = 'Hips';
    hips.position.set(0, 1, 0);

    const leftUpLeg = new Bone();
    leftUpLeg.name = 'LeftUpLeg';
    leftUpLeg.position.set(0.1, -0.1, 0);

    const leftLeg = new Bone();
    leftLeg.name = 'LeftLeg';
    leftLeg.position.set(0, -0.4, 0);

    const leftFoot = new Bone();
    leftFoot.name = 'LeftFoot';
    leftFoot.position.set(0, -0.45, 0);

    const leftToe = new Bone();
    leftToe.name = 'LeftToeBase';
    // Forward (+Z), slightly down — Mixamo toe direction.
    leftToe.position.set(0, -0.03, 0.12);

    hips.add(leftUpLeg);
    leftUpLeg.add(leftLeg);
    leftLeg.add(leftFoot);
    leftFoot.add(leftToe);
    hips.updateMatrixWorld(true);

    orientSkeletonMixamoAxes([hips, leftUpLeg, leftLeg, leftFoot, leftToe]);
    hips.updateMatrixWorld(true);

    const x = new Vector3(1, 0, 0).applyQuaternion(
      leftFoot.getWorldQuaternion(new Quaternion()),
    );
    expect(x.x).toBeCloseTo(-1, 1);
    expect(Math.abs(x.y)).toBeLessThan(0.2);
    expect(Math.abs(x.z)).toBeLessThan(0.2);
  });
});
