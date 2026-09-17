import type { Object3D } from 'three';
import type { PoseEditKind } from './pose-edit-store';
import { atom, computed } from 'nanostores';
import { getRestRootScale } from '@/modules/animation/domain/rest-pose';
import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import {
  sampleMixerAt,
  suspendMixerBindings,
} from '@/modules/animation/utils/mixer-session';
import { degreesToRadians, radiansToDegrees, wrapDegrees } from '../domain/euler-degrees';
import { resolveSettingsFocus } from '../domain/settings-focus';
import { $activeModel } from './model-store';
import {
  $poseDirty,
  $poseEditKind,
  capturePreEditTransform,
  markPoseDirty,

} from './pose-edit-store';
import { $selection } from './selection-store';

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

/** Live TRS for Settings (model root, empty group, or selected part). */
export const $transformReadout = atom<TransformReadout | null>(null);

/** Selection-driven Settings section visibility + transform binding. */
export const $settingsFocus = computed(
  [$selection, $activeModel],
  () => resolveSettingsFocus(),
);

/**
 * Object whose TRS the driver mirrors into `$transformReadout`.
 * Model root / group for Model section; part mesh when Part section owns TRS.
 */
export const $settingsTransformTarget = computed(
  [$settingsFocus],
  (focus) => focus.modelTransformTarget ?? focus.partObject,
);

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

/** Push object position, Euler degrees, and scale into the Settings readout. */
export function syncTransformReadout(object: Object3D | null): void {
  if (!object) {
    $transformReadout.set(null);
    return;
  }
  const { x, y, z } = object.position;
  $transformReadout.set({
    x,
    y,
    z,
    ...readRotationDegrees(object),
    scaleX: object.scale.x,
    scaleY: object.scale.y,
    scaleZ: object.scale.z,
  });
}

function resolveEditTarget(): { object: Object3D; poseKind: PoseEditKind } | null {
  const focus = resolveSettingsFocus();
  if (focus.kind === 'group' && focus.modelTransformTarget) {
    return { object: focus.modelTransformTarget, poseKind: 'selection' };
  }
  if (focus.kind === 'idle' && focus.modelTransformTarget) {
    return { object: focus.modelTransformTarget, poseKind: 'modelRoot' };
  }
  // Part TRS uses selection apply helpers with an explicit object.
  return null;
}

function beginSettingsEdit(object: Object3D, poseKind: PoseEditKind): void {
  if ($poseDirty.get() && $poseEditKind.get() !== poseKind) {
    commitPendingPose();
  }

  if (!$poseDirty.get()) {
    capturePreEditTransform(object, poseKind);
  }

  pause();
  suspendMixerBindings();
}

function finishSettingsEdit(object: Object3D, poseKind: PoseEditKind): void {
  object.updateMatrixWorld(true);

  if (poseKind === 'modelRoot' && $clips.get().activeClipId) {
    sampleMixerAt(0);
  }

  markPoseDirty();
  syncTransformReadout(object);
}

/**
 * Apply one position axis from Settings (model root or selected group).
 */
export function applyTransformPositionAxis(axis: TransformAxis, value: number): void {
  if (!Number.isFinite(value)) {
    return;
  }

  const target = resolveEditTarget();
  if (!target) {
    return;
  }
  const { object, poseKind } = target;

  if (object.position[axis] === value) {
    return;
  }

  beginSettingsEdit(object, poseKind);
  object.position[axis] = value;
  finishSettingsEdit(object, poseKind);
}

/**
 * Apply one Euler axis (degrees, 0–360) from Settings.
 */
export function applyTransformRotationAxis(axis: TransformAxis, degrees: number): void {
  if (!Number.isFinite(degrees)) {
    return;
  }

  const target = resolveEditTarget();
  if (!target) {
    return;
  }
  const { object, poseKind } = target;

  const next = wrapDegrees(degrees);
  object.rotation.setFromQuaternion(object.quaternion, 'XYZ');
  const current = radiansToDegrees(object.rotation[axis]);
  if (current === next) {
    return;
  }

  beginSettingsEdit(object, poseKind);
  object.rotation.order = 'XYZ';
  object.rotation[axis] = degreesToRadians(next);
  finishSettingsEdit(object, poseKind);
}

/**
 * Apply one scale axis from Settings (clamped to ≥ MIN_ROOT_SCALE).
 */
export function applyTransformScaleAxis(axis: TransformAxis, value: number): void {
  if (!Number.isFinite(value) || value < MIN_ROOT_SCALE) {
    return;
  }

  const target = resolveEditTarget();
  if (!target) {
    return;
  }
  const { object, poseKind } = target;

  if (object.scale[axis] === value) {
    return;
  }

  beginSettingsEdit(object, poseKind);
  object.scale[axis] = value;
  finishSettingsEdit(object, poseKind);
}

/**
 * Settings scale as percent of rest size (`100` = rest scale on that axis).
 * Model root uses bind rest; groups use unit scale (1 = 100%).
 */
export function applyTransformScalePercentAxis(axis: TransformAxis, percent: number): void {
  if (!Number.isFinite(percent) || percent <= 0) {
    return;
  }

  const target = resolveEditTarget();
  if (!target) {
    return;
  }
  const { object, poseKind } = target;

  const rest = poseKind === 'modelRoot'
    ? getRestRootScale(object)[axis]
    : 1;
  if (!(rest > 0)) {
    return;
  }

  applyTransformScaleAxis(axis, (percent / 100) * rest);
}

/** Apply TRS axis to an explicit selection object (created part). */
export function applySelectionPositionAxis(
  object: Object3D,
  axis: TransformAxis,
  value: number,
): void {
  if (!Number.isFinite(value) || object.position[axis] === value) {
    return;
  }
  beginSettingsEdit(object, 'selection');
  object.position[axis] = value;
  finishSettingsEdit(object, 'selection');
}

export function applySelectionRotationAxis(
  object: Object3D,
  axis: TransformAxis,
  degrees: number,
): void {
  if (!Number.isFinite(degrees)) {
    return;
  }
  const next = wrapDegrees(degrees);
  object.rotation.setFromQuaternion(object.quaternion, 'XYZ');
  const current = radiansToDegrees(object.rotation[axis]);
  if (current === next) {
    return;
  }
  beginSettingsEdit(object, 'selection');
  object.rotation.order = 'XYZ';
  object.rotation[axis] = degreesToRadians(next);
  finishSettingsEdit(object, 'selection');
}

export function applySelectionScalePercentAxis(
  object: Object3D,
  axis: TransformAxis,
  percent: number,
): void {
  if (!Number.isFinite(percent) || percent <= 0) {
    return;
  }
  const value = (percent / 100) * 1;
  if (value < MIN_ROOT_SCALE || object.scale[axis] === value) {
    return;
  }
  beginSettingsEdit(object, 'selection');
  object.scale[axis] = value;
  finishSettingsEdit(object, 'selection');
}

export function readObjectTransform(object: Object3D): TransformReadout {
  const { x, y, z } = object.position;
  return {
    x,
    y,
    z,
    ...readRotationDegrees(object),
    scaleX: object.scale.x,
    scaleY: object.scale.y,
    scaleZ: object.scale.z,
  };
}
