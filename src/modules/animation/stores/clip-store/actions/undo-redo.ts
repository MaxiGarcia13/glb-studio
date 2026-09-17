import {
  takeRedoCommand,
  takeUndoCommand,
} from '@/modules/animation/stores/undo-stack-store';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { applyUndoableCommand } from './apply-undoable-command';
import { commitPendingPose } from './commit-pending-pose';

/**
 * Apply the last stacked edit’s `before` snapshot. An open gesture is flushed
 * onto the stack first, then undone — same net as discarding the in-progress pose.
 */
export function undoLastEdit(): void {
  if ($poseDirty.get()) {
    commitPendingPose();
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
