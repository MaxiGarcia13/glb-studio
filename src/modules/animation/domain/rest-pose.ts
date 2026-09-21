import type { Object3D } from 'three';
import { radiansToDegrees } from '@/modules/viewport/domain/euler-degrees';

interface NodeRestTransform {
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

type RestPoseMap = Map<string, NodeRestTransform>;

const restPoses = new WeakMap<Object3D, RestPoseMap>();

function readTransform(object: Object3D): NodeRestTransform {
  return {
    position: { x: object.position.x, y: object.position.y, z: object.position.z },
    quaternion: {
      x: object.quaternion.x,
      y: object.quaternion.y,
      z: object.quaternion.z,
      w: object.quaternion.w,
    },
    scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
  };
}

function writeTransform(object: Object3D, transform: NodeRestTransform): void {
  object.position.set(transform.position.x, transform.position.y, transform.position.z);
  object.quaternion.set(
    transform.quaternion.x,
    transform.quaternion.y,
    transform.quaternion.z,
    transform.quaternion.w,
  );
  object.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
}

function captureMap(root: Object3D): RestPoseMap {
  const map: RestPoseMap = new Map();
  root.traverse((object) => {
    map.set(object.uuid, readTransform(object));
  });
  return map;
}

/** Snapshot local TRS for the scene graph before any mixer action runs. */
export function ensureRestPoseCaptured(root: Object3D): void {
  if (restPoses.has(root)) {
    return;
  }
  restPoses.set(root, captureMap(root));
}

/**
 * Replace the rest-pose map with the live scene graph (e.g. eye-toggle hide
 * while no clip is bound, so create-part moves survive remount + applyRestPose).
 */
export function syncRestPoseFromScene(root: Object3D): void {
  restPoses.set(root, captureMap(root));
}

/** Keep bind / model-root Saves as the rest pose used by T-pose. */
export function refreshRestPoseNode(root: Object3D, node: Object3D): void {
  const map = restPoses.get(root) ?? captureMap(root);
  map.set(node.uuid, readTransform(node));
  restPoses.set(root, map);
}

/** Rest / bind root scale used as Settings “100%” baseline. */
export function getRestRootScale(root: Object3D): { x: number; y: number; z: number } {
  ensureRestPoseCaptured(root);
  const transform = restPoses.get(root)?.get(root.uuid);
  if (transform) {
    return { ...transform.scale };
  }
  return { x: root.scale.x, y: root.scale.y, z: root.scale.z };
}

/**
 * Read local position, XYZ Euler degrees, and scale for model-root Save.
 * Syncs `rotation` from `quaternion` before converting to degrees.
 */
export function readObjectRootTrs(object: Object3D): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
} {
  object.rotation.setFromQuaternion(object.quaternion, 'XYZ');
  return {
    position: [object.position.x, object.position.y, object.position.z],
    rotation: [
      radiansToDegrees(object.rotation.x),
      radiansToDegrees(object.rotation.y),
      radiansToDegrees(object.rotation.z),
    ],
    scale: [object.scale.x, object.scale.y, object.scale.z],
  };
}

/**
 * Apply a clip’s stored model-root position, rotation (Euler degrees, XYZ), and/or scale.
 * Null for a channel restores that channel from the rest-pose root.
 */
export function applySceneRootTransform(
  root: Object3D,
  position: [number, number, number] | null,
  rotationDegrees: [number, number, number] | null,
  scale: [number, number, number] | null = null,
): void {
  ensureRestPoseCaptured(root);
  const transform = restPoses.get(root)?.get(root.uuid);

  if (position) {
    root.position.set(position[0], position[1], position[2]);
  } else if (transform) {
    root.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z,
    );
  }

  if (rotationDegrees) {
    root.rotation.order = 'XYZ';
    root.rotation.set(
      degreesToRadians(rotationDegrees[0]),
      degreesToRadians(rotationDegrees[1]),
      degreesToRadians(rotationDegrees[2]),
    );
  } else if (transform) {
    root.quaternion.set(
      transform.quaternion.x,
      transform.quaternion.y,
      transform.quaternion.z,
      transform.quaternion.w,
    );
  }

  if (scale) {
    root.scale.set(scale[0], scale[1], scale[2]);
  } else if (transform) {
    root.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
  }

  root.updateMatrixWorld(true);
}

function degreesToRadians(degrees: number): number {
  const wrapped = ((degrees % 360) + 360) % 360;
  return (wrapped * Math.PI) / 180;
}

/** Restore captured rest / bind pose after clearing the active clip. */
export function applyRestPose(root: Object3D): void {
  ensureRestPoseCaptured(root);
  const map = restPoses.get(root);
  if (!map) {
    return;
  }

  root.traverse((object) => {
    const transform = map.get(object.uuid);
    if (transform) {
      writeTransform(object, transform);
    }
  });
  root.updateMatrixWorld(true);
}
