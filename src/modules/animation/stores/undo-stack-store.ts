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

/** Session-only undo stack; cleared on reload. */
export const $commandStack = atom(EMPTY_COMMAND_STACK);

export const $canUndo = computed($commandStack, stackCanUndo);

export const $canRedo = computed($commandStack, stackCanRedo);

export function pushUndoableCommand(command: UndoableCommand): void {
  $commandStack.set(pushCommand($commandStack.get(), command));
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

export function clearUndoStack(): void {
  const stack = $commandStack.get();
  if (stack.past.length === 0 && stack.future.length === 0) {
    return;
  }
  $commandStack.set(EMPTY_COMMAND_STACK);
}
