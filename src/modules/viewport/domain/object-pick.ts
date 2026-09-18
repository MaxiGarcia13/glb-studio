import type { Camera, Object3D } from 'three';

import { Raycaster, Vector2, Vector3 } from 'three';
import { BONE_PICK_RADIUS_PX } from '../constants/selection';

const POINTER_NDC = new Vector2();
const PROJECTED = new Vector3();
const BONE_WORLD = new Vector3();
const RAYCASTER = new Raycaster();

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PointerPosition {
  x: number;
  y: number;
}

interface BonePick {
  object: Object3D;
  screenDistance: number;
}

interface MeshPick {
  object: Object3D;
  rayDistance: number;
}

function isPickableMesh(object: Object3D): boolean {
  const mesh = object as { isMesh?: boolean; isBone?: boolean; geometry?: unknown };
  return Boolean(mesh.isMesh && !mesh.isBone && mesh.geometry && object.visible);
}

function ndcFromViewport(pointer: PointerPosition, size: ViewportSize): Vector2 {
  POINTER_NDC.x = (pointer.x / size.width) * 2 - 1;
  POINTER_NDC.y = -(pointer.y / size.height) * 2 + 1;
  return POINTER_NDC;
}

function pixelsFromNdc(point: { x: number; y: number }, size: ViewportSize): PointerPosition {
  return {
    x: (point.x + 1) * 0.5 * size.width,
    y: (1 - point.y) * 0.5 * size.height,
  };
}

function pickBoneInRoot(
  root: Object3D,
  camera: Camera,
  pointer: PointerPosition,
  size: ViewportSize,
): BonePick | null {
  let best: BonePick | null = null;

  root.traverse((object) => {
    const skinned = object as { isSkinnedMesh?: boolean; skeleton?: { bones?: Object3D[] } };
    const bones = skinned.isSkinnedMesh ? skinned.skeleton?.bones : undefined;
    if (!bones) {
      return;
    }
    for (const bone of bones) {
      if (!(bone as { isBone?: boolean }).isBone || !bone.visible) {
        continue;
      }
      bone.getWorldPosition(BONE_WORLD);
      PROJECTED.copy(BONE_WORLD).project(camera);
      const at = pixelsFromNdc(PROJECTED, size);
      const screenDistance = Math.hypot(at.x - pointer.x, at.y - pointer.y);
      if (screenDistance > BONE_PICK_RADIUS_PX) {
        continue;
      }
      if (!best || screenDistance < best.screenDistance) {
        best = { object: bone, screenDistance };
      }
    }
  });

  return best;
}

function pickMeshInRoot(
  root: Object3D,
  camera: Camera,
  pointer: PointerPosition,
  size: ViewportSize,
): MeshPick | null {
  const candidates: Object3D[] = [];
  root.traverse((object) => {
    if (isPickableMesh(object)) {
      candidates.push(object);
    }
  });
  if (candidates.length === 0) {
    return null;
  }

  RAYCASTER.setFromCamera(ndcFromViewport(pointer, size), camera);
  const hits = RAYCASTER.intersectObjects(candidates, false);
  const hit = hits[0];
  if (!hit) {
    return null;
  }

  return { object: hit.object, rayDistance: hit.distance };
}

function pickBestAcrossRoots(
  roots: Object3D[],
  camera: Camera,
  pointer: PointerPosition,
  size: ViewportSize,
): Object3D | null {
  let bestBone: BonePick | null = null;
  let bestMesh: MeshPick | null = null;

  for (const root of roots) {
    root.updateMatrixWorld(true);

    const bone = pickBoneInRoot(root, camera, pointer, size);
    if (bone && (!bestBone || bone.screenDistance < bestBone.screenDistance)) {
      bestBone = bone;
    }

    const mesh = pickMeshInRoot(root, camera, pointer, size);
    if (mesh && (!bestMesh || mesh.rayDistance < bestMesh.rayDistance)) {
      bestMesh = mesh;
    }
  }

  if (bestBone) {
    return bestBone.object;
  }

  return bestMesh?.object ?? null;
}

/** Pick the closest bone or mesh across multiple model roots. */
export function pickObjectAcrossRoots(
  roots: Object3D[],
  camera: Camera,
  pointer: PointerPosition,
  size: ViewportSize,
): Object3D | null {
  if (size.width <= 0 || size.height <= 0 || roots.length === 0) {
    return null;
  }

  return pickBestAcrossRoots(roots, camera, pointer, size);
}
