import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $poseDirty,
  $poseEditKind,
} from '@/modules/viewport/stores/pose-edit-store';
import { $clips } from '../store';
import { isReadyClip } from '../utils';
import { saveKeyframe } from './save-keyframe';

/**
 * Commit a dirty gizmo / Settings / nudge pose into the clip or bind-pose path.
 * Same hold-to-end policy as the former Save control: hold when a selection edit
 * can write into a ready driving clip (owned clip on created models).
 */
export function commitPendingPose(): void {
  if (!$poseDirty.get()) {
    return;
  }

  const poseEditKind = $poseEditKind.get();
  const model = $activeModel.get();
  const state = $clips.get();
  const drivingClipId = model
    ? resolveActiveClipIdForModel(
      state.clips,
      model.id,
      state.activeClipByModelId,
      state.activeSharedClipId,
    ) ?? state.activeClipId
    : state.activeClipId;
  const drivingClip = drivingClipId
    ? state.clips.find((entry) => entry.id === drivingClipId)
    : undefined;
  const canHoldPoseIntoDrivingClip
    = isReadyClip(drivingClip)
      && (
        model?.source !== 'created'
        || drivingClip.ownerModelId === model.id
      );
  const holdToEnd = poseEditKind === 'selection' && canHoldPoseIntoDrivingClip;

  saveKeyframe({ holdToEnd });
}
