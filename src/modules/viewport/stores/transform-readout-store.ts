import type { Object3D } from 'three';
import { atom } from 'nanostores';
import { getRestRootScale } from '@/modules/animation/domain/rest-pose';
import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { restorePose } from '@/modules/animation/stores/clip-store/actions/restore-pose';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import {
  sampleMixerAt,
  suspendMixerBindings,
} from '@/modules/animation/utils/mixer-session';
import { degreesToRadians, radiansToDegrees, wrapDegrees } from '../domain/euler-degrees';
import { $activeModel } from './model-store';
import {
  $poseDirty,
  $poseEditKind,
  capturePreEditTransform,
  markPoseDirty,
} from './pose-edit-store';

export type TransformAxis = 'x' | 'y' | 'z';

/** Reject zero / negative scale that would invert or collapse the model. */
export const MIN_ROOT_SCALE = 0.001;

export interface TransformReadout {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

/** Live model-root TRS fed by the viewport's per-frame driver. */
export const $transformReadout = atom<TransformReadout | null>(null);

function readRotationDegrees(object: Object3D): {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
} {
  object.rotation.setFromQuaternion(object.quaternion, 'XYZ');
  return {
    rotationX: radiansToDegrees(object.rotation.x),
    rotationY: radiansToDegrees(object.rotation.y),
    rotationZ: radiansToDegrees(object.rotation.z),
  };
}

/** Push `scene` position, Euler degrees, and scale into the Settings readout. */
export function syncTransformReadout(scene: Object3D | null): void {
  if (!scene) {
    $transformReadout.set(null);
    return;
  }
  const { x, y, z } = scene.position;
  $transformReadout.set({
    x,
    y,
    z,
    ...readRotationDegrees(scene),
    scaleX: scene.scale.x,
    scaleY: scene.scale.y,
    scaleZ: scene.scale.z,
  });
}

function beginModelRootSettingsEdit(object: Object3D): void {
  // Settings always edits the root; discard a pending bone/mesh edit first.
  if ($poseDirty.get() && $poseEditKind.get() === 'selection') {
    restorePose();
  }

  if (!$poseDirty.get()) {
    capturePreEditTransform(object, 'modelRoot');
  }

  pause();
  suspendMixerBindings();
}

function finishModelRootSettingsEdit(object: Object3D): void {
  object.updateMatrixWorld(true);

  if ($clips.get().activeClipId) {
    sampleMixerAt(0);
  }

  markPoseDirty();
  syncTransformReadout(object);
}

/**
 * Apply one model-root position axis from Settings — independent of Edit / Move tool.
 * Same dirty / snapshot path as Move-mode TransformControls.
 * With an active clip, samples the clip at t=0 so the animation starts under the new root.
 */
export function applyTransformPositionAxis(axis: TransformAxis, value: number): void {
  if (!Number.isFinite(value)) {
    return;
  }

  const object = $activeModel.get()?.scene ?? null;
  if (!object) {
    return;
  }

  if (object.position[axis] === value) {
    return;
  }

  beginModelRootSettingsEdit(object);
  object.position[axis] = value;
  finishModelRootSettingsEdit(object);
}

/**
 * Apply one model-root Euler axis (degrees, 0–360) from Settings.
 * Same dirty / snapshot path as position XYZ / Move gizmo.
 */
export function applyTransformRotationAxis(axis: TransformAxis, degrees: number): void {
  if (!Number.isFinite(degrees)) {
    return;
  }

  const object = $activeModel.get()?.scene ?? null;
  if (!object) {
    return;
  }

  const next = wrapDegrees(degrees);
  object.rotation.setFromQuaternion(object.quaternion, 'XYZ');
  const current = radiansToDegrees(object.rotation[axis]);
  if (current === next) {
    return;
  }

  beginModelRootSettingsEdit(object);
  object.rotation.order = 'XYZ';
  object.rotation[axis] = degreesToRadians(next);
  finishModelRootSettingsEdit(object);
}

/**
 * Apply one model-root scale axis from Settings (clamped to ≥ MIN_ROOT_SCALE).
 * Same dirty / snapshot path as position / rotation.
 */
export function applyTransformScaleAxis(axis: TransformAxis, value: number): void {
  if (!Number.isFinite(value) || value < MIN_ROOT_SCALE) {
    return;
  }

  const object = $activeModel.get()?.scene ?? null;
  if (!object) {
    return;
  }

  if (object.scale[axis] === value) {
    return;
  }

  beginModelRootSettingsEdit(object);
  object.scale[axis] = value;
  finishModelRootSettingsEdit(object);
}

/**
 * Settings scale as percent of rest / bind root size (`100` = rest scale on that axis).
 */
export function applyTransformScalePercentAxis(axis: TransformAxis, percent: number): void {
  if (!Number.isFinite(percent) || percent <= 0) {
    return;
  }

  const object = $activeModel.get()?.scene ?? null;
  if (!object) {
    return;
  }

  const rest = getRestRootScale(object)[axis];
  if (!(rest > 0)) {
    return;
  }

  applyTransformScaleAxis(axis, (percent / 100) * rest);
}
