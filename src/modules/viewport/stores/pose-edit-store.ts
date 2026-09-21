import type { Object3D } from 'three';

import { atom } from 'nanostores';
import { $activeModel, $model } from './model-store';

export type PoseEditKind = 'modelRoot' | 'selection';

export interface PreEditTransform {
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

export interface PreEditNodeSnapshot {
  modelId: string;
  nodeUuid: string;
  transform: PreEditTransform;
  /** `null` = model scene root. */
  parentUuid: string | null;
}

/** True while a gizmo or Settings pose edit is open (commits on gesture end). */
export const $poseDirty = atom(false);

/** Which object the current dirty edit applies to (independent of active tool). */
export const $poseEditKind = atom<PoseEditKind | null>(null);

/**
 * TRS snapshot(s) captured on first edit; used for bind-pose deltas and
 * multi-select undo. Cleared on commit. Single-target edits store one entry.
 */
export const $preEditNodes = atom<PreEditNodeSnapshot[] | null>(null);

/** Primary node's pre-edit TRS (same as `$preEditNodes[0].transform` when set). */
export const $preEditTransform = atom<PreEditTransform | null>(null);

export function markPoseDirty(): void {
  if (!$poseDirty.get()) {
    $poseDirty.set(true);
  }
}

function snapshotTransform(object: Object3D): PreEditTransform {
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

export function capturePreEditTransform(object: Object3D, kind: PoseEditKind): void {
  if ($preEditNodes.get()) {
    return;
  }
  const modelId = $activeModel.get()?.id ?? '';
  capturePreEditNodes([{ object, modelId }], kind);
}

function parentUuidForNode(object: Object3D, modelId: string): string | null {
  const model = $model.get().models.find((entry) => entry.id === modelId);
  if (!model || !object.parent || object.parent === model.scene) {
    return null;
  }
  return object.parent.uuid;
}

export function capturePreEditNodes(
  nodes: readonly { object: Object3D; modelId: string }[],
  kind: PoseEditKind,
): void {
  if ($preEditNodes.get() || nodes.length === 0) {
    return;
  }
  $poseEditKind.set(kind);
  const snapshots = nodes.map((entry) => ({
    modelId: entry.modelId,
    nodeUuid: entry.object.uuid,
    transform: snapshotTransform(entry.object),
    parentUuid: parentUuidForNode(entry.object, entry.modelId),
  }));
  $preEditNodes.set(snapshots);
  $preEditTransform.set(snapshots[0]?.transform ?? null);
}

export function clearPoseDirty(): void {
  if ($poseDirty.get()) {
    $poseDirty.set(false);
  }
  $preEditTransform.set(null);
  $preEditNodes.set(null);
  $poseEditKind.set(null);
}
