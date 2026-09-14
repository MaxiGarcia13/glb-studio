import { atom } from 'nanostores';
import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { restorePose } from '@/modules/animation/stores/clip-store/actions/restore-pose';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import {
  sampleMixerAt,
  suspendMixerBindings,
} from '@/modules/animation/utils/mixer-session';
import { $activeModel } from './model-store';
import {
  $poseDirty,
  $poseEditKind,
  capturePreEditTransform,
  markPoseDirty,
} from './pose-edit-store';

export type TransformAxis = 'x' | 'y' | 'z';

export interface TransformReadout {
  x: number;
  y: number;
  z: number;
}

/** Live model-root X / Y / Z readout fed by the viewport's per-frame driver. */
export const $transformReadout = atom<TransformReadout | null>(null);

/** Push `scene.position` into the Settings XYZ readout (or clear when null). */
export function syncTransformReadout(scene: { position: { x: number; y: number; z: number } } | null): void {
  if (!scene) {
    $transformReadout.set(null);
    return;
  }
  const { x, y, z } = scene.position;
  $transformReadout.set({ x, y, z });
}

/**
 * Apply one model-root axis from Settings — independent of Edit / Move tool.
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

  // Settings always edits the root; discard a pending bone/mesh edit first.
  if ($poseDirty.get() && $poseEditKind.get() === 'selection') {
    restorePose();
  }

  if (!$poseDirty.get()) {
    capturePreEditTransform(object, 'modelRoot');
  }

  pause();
  suspendMixerBindings();
  object.position[axis] = value;
  object.updateMatrixWorld(true);

  if ($clips.get().activeClipId) {
    sampleMixerAt(0);
  }

  markPoseDirty();
  syncTransformReadout(object);
}
