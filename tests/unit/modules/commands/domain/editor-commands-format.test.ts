import { describe, expect, it } from 'vitest';

import {
  EDITOR_COMMANDS,
  formatEditorCommandChord,
  formatEditorCommandChords,
  getEditorCommand,
} from '@/modules/commands/domain/editor-commands';

describe('formatEditorCommandChord', () => {
  it('formats plain keys and named keys', () => {
    expect(formatEditorCommandChord({ key: ' ' }, false)).toBe('Space');
    expect(formatEditorCommandChord({ key: 'r' }, true)).toBe('R');
    expect(formatEditorCommandChord({ key: 'ArrowLeft' }, false)).toBe('←');
    expect(formatEditorCommandChord({ key: 'Delete' }, true)).toBe('Delete');
  });

  it('uses ⌘/⇧ on mac and Ctrl+/Shift+ elsewhere', () => {
    const chord = { key: 'z', modifiers: ['mod', 'shift'] as const };
    expect(formatEditorCommandChord(chord, true)).toBe('⌘⇧Z');
    expect(formatEditorCommandChord(chord, false)).toBe('Ctrl+Shift+Z');
  });

  it('formats mod-only chords per platform', () => {
    const chord = { key: 's', modifiers: ['mod'] as const };
    expect(formatEditorCommandChord(chord, true)).toBe('⌘S');
    expect(formatEditorCommandChord(chord, false)).toBe('Ctrl+S');
  });
});

describe('formatEditorCommandChords', () => {
  it('joins multiple chords for a command', () => {
    const redo = getEditorCommand('redo');
    expect(formatEditorCommandChords(redo, true)).toBe('⌘⇧Z, ⌘Y');
    expect(formatEditorCommandChords(redo, false)).toBe(
      'Ctrl+Shift+Z, Ctrl+Y',
    );
  });
});

describe('getEditorCommand', () => {
  it('returns catalog entries by id', () => {
    expect(getEditorCommand('playPause').label).toBe('Play / Pause');
    expect(EDITOR_COMMANDS.some((c) => c.id === 'undo')).toBe(true);
  });
});
