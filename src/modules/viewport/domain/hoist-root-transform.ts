import type { Object3D } from 'three';
import { Matrix4 } from 'three';

const EPSILON = 1e-6;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}

/** True when local position / quaternion / scale are identity within epsilon. */
export function isIdentityTransform(object: Object3D): boolean {
  const { position, quaternion, scale } = object;
  return (
    nearlyEqual(position.x, 0)
    && nearlyEqual(position.y, 0)
    && nearlyEqual(position.z, 0)
    && nearlyEqual(quaternion.x, 0)
    && nearlyEqual(quaternion.y, 0)
    && nearlyEqual(quaternion.z, 0)
    && nearlyEqual(Math.abs(quaternion.w), 1)
    && nearlyEqual(scale.x, 1)
    && nearlyEqual(scale.y, 1)
    && nearlyEqual(scale.z, 1)
  );
}

function isGeometryNode(object: Object3D): boolean {
  return Boolean(
    (object as Object3D & { isMesh?: boolean }).isMesh
    || (object as Object3D & { isSkinnedMesh?: boolean }).isSkinnedMesh
    || (object as Object3D & { isBone?: boolean }).isBone,
  );
}

/**
 * Pure transform wrapper: no mesh/bone on this node, exactly one child.
 * Safe to peel so a deeper TRS can be hoisted onto the editable scene root.
 */
function isPeelableWrapper(object: Object3D): boolean {
  return !isGeometryNode(object) && object.children.length === 1;
}

const scratchMatrix = new Matrix4();

/**
 * Promote authored / exported TRS from single-child GLTF wrappers onto `root`
 * so Settings and Move edit the same node (`gltf.scene`) the viewport mounts.
 *
 * Walks: compose a non-identity child's local matrix into the root and clear the
 * child; peel identity-only wrappers by reparenting their child with world
 * transform preserved (`attach`).
 */
export function hoistRootTransform(root: Object3D): void {
  let guard = 0;
  while (root.children.length === 1 && guard < 32) {
    guard += 1;
    const child = root.children[0];
    if (!child) {
      break;
    }

    if (!isIdentityTransform(child)) {
      root.updateMatrix();
      child.updateMatrix();
      scratchMatrix.copy(root.matrix).multiply(child.matrix);
      scratchMatrix.decompose(root.position, root.quaternion, root.scale);
      child.position.set(0, 0, 0);
      child.quaternion.identity();
      child.scale.set(1, 1, 1);
      child.updateMatrix();
      root.updateMatrixWorld(true);
      continue;
    }

    if (!isPeelableWrapper(child)) {
      break;
    }

    const grandchild = child.children[0];
    if (!grandchild) {
      break;
    }

    root.attach(grandchild);
    root.remove(child);
    root.updateMatrixWorld(true);
  }
}
