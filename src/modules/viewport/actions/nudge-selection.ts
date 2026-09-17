import { Vector3 } from 'three';

import { pause } from '@/modules/animation/stores/clip-store/actions/playback';
import { restorePose } from '@/modules/animation/stores/clip-store/actions/restore-pose';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import {
  sampleMixerAt,
  suspendMixerBindings,
} from '@/modules/animation/utils/mixer-session';
import { $editTool } from '../stores/edit-tool-store';
import { $activeModel } from '../stores/model-store';
import {
  $poseDirty,
  $poseEditKind,
  capturePreEditTransform,
  markPoseDirty,
} from '../stores/pose-edit-store';
import { $selection } from '../stores/selection-store';
import { syncTransformReadout } from '../stores/transform-readout-store';
import { $viewportSettings } from '../stores/viewport-settings-store';

export type NudgeAxis = 'x' | 'y' | 'z';

const scratchDelta = new Vector3();
const scratchWorld = new Vector3();

/**
 * Nudge the gizmo target by one grid step on a world/local axis (US-10).
 * Edit = local space + selection; Move = world space + model root.
 */
export function nudgeSelection(axis: NudgeAxis, sign: 1 | -1): void {
  const editTool = $editTool.get();
  if (editTool === 'navigate') {
    return;
  }

  const isMove = editTool === 'move';
  const activeModel = $activeModel.get();
  const object = isMove
    ? activeModel?.scene ?? null
    : $selection.get().object;
  if (!object) {
    return;
  }

  const poseKind = isMove ? 'modelRoot' : 'selection';
  const step = $viewportSettings.get().gridStepMetres * sign;
  if (!(step !== 0 && Number.isFinite(step))) {
    return;
  }

  if ($poseDirty.get() && $poseEditKind.get() !== poseKind) {
    restorePose();
  }

  if (!$poseDirty.get()) {
    capturePreEditTransform(object, poseKind);
  }

  pause();
  suspendMixerBindings();

  if (isMove) {
    // World-space translate along world X / Y / Z, then write local position.
    object.parent?.updateMatrixWorld(true);
    object.getWorldPosition(scratchWorld);
    scratchDelta.set(0, 0, 0);
    scratchDelta[axis] = step;
    scratchWorld.add(scratchDelta);
    if (object.parent) {
      object.parent.worldToLocal(scratchWorld);
    }
    object.position.copy(scratchWorld);
  } else {
    // Local-space translate along the object's local axes.
    object.position[axis] += step;
  }

  object.updateMatrixWorld(true);

  if (poseKind === 'modelRoot' && $clips.get().activeClipId) {
    sampleMixerAt(0);
  }

  markPoseDirty();
  syncTransformReadout(object);
}
