import type { EditorCommandId } from '../types/editor-command';

import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import {
  pause,
  play,
} from '@/modules/animation/stores/clip-store/actions/playback';
import { redoLastEdit, undoLastEdit } from '@/modules/animation/stores/clip-store/actions/undo-redo';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import { copySelectedCreatePart } from '@/modules/create/actions/copy-selected-create-part';
import { createEmptyModel } from '@/modules/create/actions/create-empty-model';
import { deleteSelectedPart } from '@/modules/create/actions/delete-selected-part';
import { pasteCreatePartFromClipboard } from '@/modules/create/actions/paste-create-part-from-clipboard';
import { nudgeSelection } from '@/modules/viewport/actions/nudge-selection';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { setTransformMode } from '@/modules/viewport/stores/transform-mode-store';
import {
  $viewportSettings,
  setAxesVisible,
  setBonesVisible,
} from '@/modules/viewport/stores/viewport-settings-store';

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

function toggleBones(): void {
  setBonesVisible(!$viewportSettings.get().bonesVisible);
}

const HANDLERS: Record<EditorCommandId, () => void> = {
  playPause: togglePlayPause,
  toggleAxes,
  toggleBones,
  editToolNavigate: () => setEditTool('navigate'),
  editToolEdit: () => setEditTool('edit'),
  editToolMove: () => setEditTool('move'),
  transformMove: () => setTransformMode('translate'),
  transformRotate: () => setTransformMode('rotate'),
  transformScale: () => setTransformMode('scale'),
  nudgeNegX: () => nudgeSelection('x', -1),
  nudgePosX: () => nudgeSelection('x', 1),
  nudgePosY: () => nudgeSelection('y', 1),
  nudgeNegY: () => nudgeSelection('y', -1),
  nudgePosZ: () => nudgeSelection('z', 1),
  nudgeNegZ: () => nudgeSelection('z', -1),
  savePending: commitPendingPose,
  newModel: createEmptyModel,
  copyCreatePart: copySelectedCreatePart,
  pasteCreatePart: pasteCreatePartFromClipboard,
  deleteCreatePart: deleteSelectedPart,
  undo: undoLastEdit,
  redo: redoLastEdit,
};

/** Map a catalog command id to existing module actions (no UI). */
export function runEditorCommand(id: EditorCommandId): void {
  HANDLERS[id]();
}
