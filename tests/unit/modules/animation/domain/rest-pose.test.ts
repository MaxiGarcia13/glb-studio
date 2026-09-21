import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import {
  applyRestPose,
  ensureRestPoseCaptured,
  syncRestPoseFromScene,
} from '@/modules/animation/domain/rest-pose';

function part(): Mesh {
  return new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
}

describe('rest-pose', () => {
  it('syncRestPoseFromScene lets applyRestPose keep later Edit TRS', () => {
    const root = new Group();
    const mesh = part();
    mesh.position.set(0.25, 0, 0);
    root.add(mesh);

    ensureRestPoseCaptured(root);

    mesh.position.set(2, 0.5, -1);
    syncRestPoseFromScene(root);

    mesh.position.set(0, 0, 0);
    applyRestPose(root);

    expect(mesh.position.x).toBe(2);
    expect(mesh.position.y).toBe(0.5);
    expect(mesh.position.z).toBe(-1);
  });

  it('applyRestPose restores the first capture when sync was never called', () => {
    const root = new Group();
    const mesh = part();
    mesh.position.set(0.25, 0, 0);
    root.add(mesh);

    ensureRestPoseCaptured(root);
    mesh.position.set(2, 0, 0);
    applyRestPose(root);

    expect(mesh.position.x).toBe(0.25);
  });
});
