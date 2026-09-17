import type { Object3D } from 'three';

import { atom } from 'nanostores';

export type PoseEditKind = 'modelRoot' | 'selection';

export interface PreEditTransform {
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

/** True while a gizmo or Settings pose edit is in progress (Restore / auto-commit). */
export const $poseDirty = atom(false);

/** Which object the current dirty edit applies to (independent of active tool). */
export const $poseEditKind = atom<PoseEditKind | null>(null);

/** TRS snapshot captured on first edit, cleared on save / restore / seek / reselect. */
export const $preEditTransform = atom<PreEditTransform | null>(null);

export function markPoseDirty(): void {
  if (!$poseDirty.get()) {
    $poseDirty.set(true);
  }
}

export function capturePreEditTransform(object: Object3D, kind: PoseEditKind): void {
  if ($preEditTransform.get()) {
    return;
  }
  $poseEditKind.set(kind);
  $preEditTransform.set({
    position: { x: object.position.x, y: object.position.y, z: object.position.z },
    quaternion: {
      x: object.quaternion.x,
      y: object.quaternion.y,
      z: object.quaternion.z,
      w: object.quaternion.w,
    },
    scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
  });
}

export function restoreFromSnapshot(object: Object3D): void {
  const snapshot = $preEditTransform.get();
  if (!snapshot) {
    return;
  }
  object.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
  object.quaternion.set(
    snapshot.quaternion.x,
    snapshot.quaternion.y,
    snapshot.quaternion.z,
    snapshot.quaternion.w,
  );
  object.scale.set(snapshot.scale.x, snapshot.scale.y, snapshot.scale.z);
  object.updateMatrixWorld(true);
}

export function clearPoseDirty(): void {
  if ($poseDirty.get()) {
    $poseDirty.set(false);
  }
  $preEditTransform.set(null);
  $poseEditKind.set(null);
}
