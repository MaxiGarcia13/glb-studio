import type { UndoableCommand } from '@/modules/animation/types/undo-stack';
import { describe, expect, it } from 'vitest';

import {
  canRedo,
  canUndo,
  EMPTY_COMMAND_STACK,
  pushCommand,
  redoCommand,
  undoCommand,
} from '@/modules/animation/domain/command-stack';

function timeScaleCommand(
  clipId: string,
  before: number,
  after: number,
): UndoableCommand {
  return {
    id: 'setTimeScale',
    clipId,
    before: { timeScale: before },
    after: { timeScale: after },
  };
}

describe('command-stack', () => {
  it('starts empty with neither undo nor redo', () => {
    expect(canUndo(EMPTY_COMMAND_STACK)).toBe(false);
    expect(canRedo(EMPTY_COMMAND_STACK)).toBe(false);
    expect(undoCommand(EMPTY_COMMAND_STACK)).toBeNull();
    expect(redoCommand(EMPTY_COMMAND_STACK)).toBeNull();
  });

  it('push appends to past', () => {
    const a = timeScaleCommand('clip-a', 1, 2);
    const stack = pushCommand(EMPTY_COMMAND_STACK, a);

    expect(stack.past).toEqual([a]);
    expect(stack.future).toEqual([]);
    expect(canUndo(stack)).toBe(true);
    expect(canRedo(stack)).toBe(false);
  });

  it('undo moves the last command onto future', () => {
    const a = timeScaleCommand('clip-a', 1, 2);
    const b = timeScaleCommand('clip-b', 1, 0.5);
    const stacked = pushCommand(pushCommand(EMPTY_COMMAND_STACK, a), b);

    const undone = undoCommand(stacked);
    expect(undone).not.toBeNull();
    expect(undone!.command).toBe(b);
    expect(undone!.stack.past).toEqual([a]);
    expect(undone!.stack.future).toEqual([b]);
    expect(canUndo(undone!.stack)).toBe(true);
    expect(canRedo(undone!.stack)).toBe(true);
  });

  it('redo moves the last future command back onto past', () => {
    const a = timeScaleCommand('clip-a', 1, 2);
    const afterUndo = undoCommand(pushCommand(EMPTY_COMMAND_STACK, a))!;

    const redone = redoCommand(afterUndo.stack);
    expect(redone).not.toBeNull();
    expect(redone!.command).toBe(a);
    expect(redone!.stack.past).toEqual([a]);
    expect(redone!.stack.future).toEqual([]);
    expect(canRedo(redone!.stack)).toBe(false);
  });

  it('push drops the redo branch', () => {
    const a = timeScaleCommand('clip-a', 1, 2);
    const b = timeScaleCommand('clip-b', 1, 0.5);
    const c = timeScaleCommand('clip-c', 1, 3);

    const afterUndo = undoCommand(pushCommand(pushCommand(EMPTY_COMMAND_STACK, a), b))!;
    expect(afterUndo.stack.future).toEqual([b]);

    const afterPush = pushCommand(afterUndo.stack, c);
    expect(afterPush.past).toEqual([a, c]);
    expect(afterPush.future).toEqual([]);
    expect(canRedo(afterPush)).toBe(false);
    expect(redoCommand(afterPush)).toBeNull();
  });
});
