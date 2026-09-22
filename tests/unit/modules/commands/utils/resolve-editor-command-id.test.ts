import { describe, expect, it } from 'vitest';

import { resolveEditorCommandId } from '@/modules/commands/utils/resolve-editor-command-id';

function event(
  partial: Partial<
    Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>
  >,
): Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'> {
  return {
    key: 'a',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...partial,
  };
}

describe('resolveEditorCommandId', () => {
  it('resolves catalog chords to command ids', () => {
    expect(resolveEditorCommandId(event({ key: ' ' }))).toBe('playPause');
    expect(resolveEditorCommandId(event({ key: 'q' }))).toBe('transformMove');
    expect(
      resolveEditorCommandId(event({ key: 's', metaKey: true })),
    ).toBe('savePending');
    expect(resolveEditorCommandId(event({ key: 'n' }))).toBe('newModel');
    expect(
      resolveEditorCommandId(event({ key: 'ArrowUp', shiftKey: true })),
    ).toBe('nudgePosZ');
  });

  it('resolves delete via Delete or Backspace (macOS delete key)', () => {
    expect(resolveEditorCommandId(event({ key: 'Delete' }))).toBe(
      'deleteCreatePart',
    );
    expect(resolveEditorCommandId(event({ key: 'Backspace' }))).toBe(
      'deleteCreatePart',
    );
  });

  it('resolves redo via either catalog chord', () => {
    expect(
      resolveEditorCommandId(event({ key: 'z', metaKey: true, shiftKey: true })),
    ).toBe('redo');
    expect(
      resolveEditorCommandId(event({ key: 'y', ctrlKey: true })),
    ).toBe('redo');
  });

  it('returns null for unmatched or alt-modified keys', () => {
    expect(resolveEditorCommandId(event({ key: 'x' }))).toBeNull();
    expect(resolveEditorCommandId(event({ key: ' ', altKey: true }))).toBeNull();
    expect(
      resolveEditorCommandId(event({ key: 'q', metaKey: true })),
    ).toBeNull();
    expect(
      resolveEditorCommandId(event({ key: 'n', metaKey: true })),
    ).toBeNull();
  });
});
