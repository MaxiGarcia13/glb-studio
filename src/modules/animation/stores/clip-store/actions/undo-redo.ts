import {
  takeRedoCommand,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { applyUndoableCommand } from './apply-undoable-command';
import { restorePose } from './restore-pose';

/**
 * Discard an unsaved in-progress gizmo / Settings pose, or apply the last
 * stacked edit’s `before` snapshot. Open gestures are not stack entries (US-10);
 * Undo matches Restore until the gesture auto-commits.
 */
export function undoLastEdit(): void {
  if ($poseDirty.get()) {
    restorePose();
    return;
  }

  const command = takeUndoCommand();
  if (!command) {
    return;
  }
  applyUndoableCommand(command, 'undo');
}

/** Apply the last undone edit’s `after` snapshot. No-op when there is nothing to redo. */
export function redoLastEdit(): void {
  const command = takeRedoCommand();
  if (!command) {
    return;
  }
  applyUndoableCommand(command, 'redo');
}
