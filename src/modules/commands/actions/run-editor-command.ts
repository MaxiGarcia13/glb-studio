import type { EditorCommandId } from '../types/editor-command';

import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import {
  pause,
  play,
} from '@/modules/animation/stores/clip-store/actions/playback';
import { saveKeyframe } from '@/modules/animation/stores/clip-store/actions/save-keyframe';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import { isReadyClip } from '@/modules/animation/stores/clip-store/utils';
import { copySelectedCreatePart } from '@/modules/create/actions/copy-selected-create-part';
import { deleteSelectedPart } from '@/modules/create/actions/delete-selected-part';
import { pasteCreatePartFromClipboard } from '@/modules/create/actions/paste-create-part-from-clipboard';
import { nudgeSelection } from '@/modules/viewport/actions/nudge-selection';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $poseDirty,
  $poseEditKind,
} from '@/modules/viewport/stores/pose-edit-store';
import { setTransformMode } from '@/modules/viewport/stores/transform-mode-store';
import {
  $viewportSettings,
  setAxesVisible,
} from '@/modules/viewport/stores/viewport-settings-store';

/** Filled by later US-10 wire tasks (undo stack). */
function notImplementedYet(): void {}

function togglePlayPause(): void {
  if ($clips.get().playing) {
    pause();
    return;
  }
  play();
}

function toggleAxes(): void {
  setAxesVisible(!$viewportSettings.get().axesVisible);
}

/**
 * Same hold-to-end policy as SaveKeyframeButton: hold when a selection edit can
 * write into a ready driving clip (owned clip on created models).
 */
function savePendingChange(): void {
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

const HANDLERS: Record<EditorCommandId, () => void> = {
  playPause: togglePlayPause,
  toggleAxes,
  transformMove: () => setTransformMode('translate'),
  transformRotate: () => setTransformMode('rotate'),
  transformScale: () => setTransformMode('scale'),
  nudgeNegX: () => nudgeSelection('x', -1),
  nudgePosX: () => nudgeSelection('x', 1),
  nudgePosY: () => nudgeSelection('y', 1),
  nudgeNegY: () => nudgeSelection('y', -1),
  nudgePosZ: () => nudgeSelection('z', 1),
  nudgeNegZ: () => nudgeSelection('z', -1),
  savePending: savePendingChange,
  copyCreatePart: copySelectedCreatePart,
  pasteCreatePart: pasteCreatePartFromClipboard,
  deleteCreatePart: deleteSelectedPart,
  undo: notImplementedYet,
  redo: notImplementedYet,
};

/** Map a catalog command id to existing module actions (no UI). */
export function runEditorCommand(id: EditorCommandId): void {
  HANDLERS[id]();
}
