import type { UndoableCommand } from '@/modules/animation/types/undo-stack';

/**
 * In-memory undo/redo stack (US-10). Unbounded; no persistence.
 * Callers apply `before` / `after` snapshots after `undoCommand` / `redoCommand`.
 */
export interface CommandStackState {
  readonly past: readonly UndoableCommand[];
  readonly future: readonly UndoableCommand[];
}

export const EMPTY_COMMAND_STACK: CommandStackState = {
  past: [],
  future: [],
};

export function canUndo(stack: CommandStackState): boolean {
  return stack.past.length > 0;
}

export function canRedo(stack: CommandStackState): boolean {
  return stack.future.length > 0;
}

/** Push a committed edit and drop any redo branch. */
export function pushCommand(
  stack: CommandStackState,
  command: UndoableCommand,
): CommandStackState {
  return {
    past: [...stack.past, command],
    future: [],
  };
}

export function undoCommand(
  stack: CommandStackState,
): { stack: CommandStackState; command: UndoableCommand } | null {
  if (stack.past.length === 0) {
    return null;
  }

  const command = stack.past.at(-1);
  if (!command) {
    return null;
  }

  return {
    command,
    stack: {
      past: stack.past.slice(0, -1),
      future: [...stack.future, command],
    },
  };
}

export function redoCommand(
  stack: CommandStackState,
): { stack: CommandStackState; command: UndoableCommand } | null {
  if (stack.future.length === 0) {
    return null;
  }

  const command = stack.future.at(-1);
  if (!command) {
    return null;
  }

  return {
    command,
    stack: {
      past: [...stack.past, command],
      future: stack.future.slice(0, -1),
    },
  };
}
