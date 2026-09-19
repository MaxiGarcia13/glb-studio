import type { Object3D } from 'three';
import { Vector3 } from 'three';

import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { suspendMixerBindings } from '@/modules/animation/utils/mixer-session';
import { POSITION_EDIT_STEP_METRES } from '../constants/position-edit';
import { resolvePositionEditTargets } from '../domain/resolve-position-edit-targets';
import {
  $poseDirty,
  $poseEditKind,
  capturePreEditNodes,
  markPoseDirty,
} from '../stores/pose-edit-store';
import { syncTransformReadout } from '../stores/transform-readout-store';

export type NudgeAxis = 'x' | 'y' | 'z';

const scratchDelta = new Vector3();
const scratchWorld = new Vector3();

function applyWorldStep(object: Object3D, axis: NudgeAxis, step: number): void {
  object.parent?.updateMatrixWorld(true);
  object.getWorldPosition(scratchWorld);
  scratchDelta.set(0, 0, 0);
  scratchDelta[axis] = step;
  scratchWorld.add(scratchDelta);
  if (object.parent) {
    object.parent.worldToLocal(scratchWorld);
  }
  object.position.copy(scratchWorld);
}

/**
 * Nudge every position-edit target by one step on a world/local axis (US-10).
 * Step matches TRS position input spinners (`POSITION_EDIT_STEP_METRES`).
 * Edit = local space + selection roots; Move = world space + model root;
 * model multi-select = world space on each selected model root.
 * Each step auto-commits (one undo entry).
 */
export function nudgeSelection(axis: NudgeAxis, sign: 1 | -1): void {
  const { targets, primary, space, poseKind } = resolvePositionEditTargets();
  if (targets.length === 0 || !primary) {
    return;
  }

  const step = POSITION_EDIT_STEP_METRES * sign;

  if ($poseDirty.get() && $poseEditKind.get() !== poseKind) {
    commitPendingPose();
  }

  if (!$poseDirty.get()) {
    capturePreEditNodes(targets, poseKind);
  }

  pause();
  suspendMixerBindings();

  for (const { object } of targets) {
    if (space === 'world') {
      applyWorldStep(object, axis, step);
    } else {
      object.position[axis] += step;
    }
    object.updateMatrixWorld(true);
  }

  markPoseDirty();
  syncTransformReadout(primary);
  commitPendingPose();
}
