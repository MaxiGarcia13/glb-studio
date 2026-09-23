import type { UndoableCommand } from '@/modules/animation/types/undo-stack';

import { atom, computed } from 'nanostores';
import {
  EMPTY_COMMAND_STACK,
  pushCommand,
  redoCommand,
  canRedo as stackCanRedo,
  canUndo as stackCanUndo,
  undoCommand,
} from '@/modules/animation/domain/command-stack';
import { disposeUndoableCommandResources } from '@/modules/create/domain/material-color-map-undo';

/** Session-only undo stack; cleared on reload. */
export const $commandStack = atom(EMPTY_COMMAND_STACK);

export const $canUndo = computed($commandStack, stackCanUndo);

export const $canRedo = computed($commandStack, stackCanRedo);

function disposeCommands(commands: readonly UndoableCommand[]): void {
  for (const command of commands) {
    disposeUndoableCommandResources(command);
  }
}

/** Push a committed edit; dispose resources on the dropped redo branch (US-46). */
export function pushUndoableCommand(command: UndoableCommand): void {
  const stack = $commandStack.get();
  if (stack.future.length > 0) {
    disposeCommands(stack.future);
  }
  $commandStack.set(pushCommand(stack, command));
}

/** Pop the last commit for the caller to apply `before`. */
export function takeUndoCommand(): UndoableCommand | null {
  const result = undoCommand($commandStack.get());
  if (!result) {
    return null;
  }
  $commandStack.set(result.stack);
  return result.command;
}

/** Pop the last undone commit for the caller to apply `after`. */
export function takeRedoCommand(): UndoableCommand | null {
  const result = redoCommand($commandStack.get());
  if (!result) {
    return null;
  }
  $commandStack.set(result.stack);
  return result.command;
}

/** Clear the session stack and free materialColorMap texture clones. */
export function clearUndoStack(): void {
  const stack = $commandStack.get();
  if (stack.past.length === 0 && stack.future.length === 0) {
    return;
  }
  disposeCommands(stack.past);
  disposeCommands(stack.future);
  $commandStack.set(EMPTY_COMMAND_STACK);
}
