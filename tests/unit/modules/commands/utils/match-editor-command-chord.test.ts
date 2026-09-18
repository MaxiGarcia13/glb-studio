import { describe, expect, it } from 'vitest';

import {
  matchesEditorCommandChord,
  normalizeEventKey,
} from '@/modules/commands/utils/match-editor-command-chord';

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

describe('normalizeEventKey', () => {
  it('lowercases single-character keys', () => {
    expect(normalizeEventKey('A')).toBe('a');
    expect(normalizeEventKey(' ')).toBe(' ');
  });

  it('leaves named keys unchanged', () => {
    expect(normalizeEventKey('ArrowLeft')).toBe('ArrowLeft');
    expect(normalizeEventKey('Delete')).toBe('Delete');
  });
});

describe('matchesEditorCommandChord', () => {
  it('matches a plain key with no modifiers', () => {
    expect(
      matchesEditorCommandChord(event({ key: ' ' }), { key: ' ' }),
    ).toBe(true);
    expect(
      matchesEditorCommandChord(event({ key: 'R' }), { key: 'r' }),
    ).toBe(true);
  });

  it('rejects when the key differs', () => {
    expect(
      matchesEditorCommandChord(event({ key: 'q' }), { key: 'w' }),
    ).toBe(false);
  });

  it('requires mod (meta or ctrl) when chord asks for mod', () => {
    const chord = { key: 's', modifiers: ['mod'] as const };
    expect(matchesEditorCommandChord(event({ key: 's' }), chord)).toBe(false);
    expect(
      matchesEditorCommandChord(event({ key: 's', metaKey: true }), chord),
    ).toBe(true);
    expect(
      matchesEditorCommandChord(event({ key: 's', ctrlKey: true }), chord),
    ).toBe(true);
  });

  it('rejects extra mod when chord has none', () => {
    expect(
      matchesEditorCommandChord(event({ key: 'r', metaKey: true }), { key: 'r' }),
    ).toBe(false);
  });

  it('requires shift exactly when chord asks for it', () => {
    const chord = { key: 'ArrowUp', modifiers: ['shift'] as const };
    expect(
      matchesEditorCommandChord(event({ key: 'ArrowUp' }), chord),
    ).toBe(false);
    expect(
      matchesEditorCommandChord(
        event({ key: 'ArrowUp', shiftKey: true }),
        chord,
      ),
    ).toBe(true);
    expect(
      matchesEditorCommandChord(
        event({ key: 'ArrowUp', shiftKey: true }),
        { key: 'ArrowUp' },
      ),
    ).toBe(false);
  });

  it('matches mod+shift together', () => {
    const chord = { key: 'z', modifiers: ['mod', 'shift'] as const };
    expect(
      matchesEditorCommandChord(
        event({ key: 'z', metaKey: true, shiftKey: true }),
        chord,
      ),
    ).toBe(true);
    expect(
      matchesEditorCommandChord(
        event({ key: 'z', metaKey: true }),
        chord,
      ),
    ).toBe(false);
  });

  it('never matches when alt is held', () => {
    expect(
      matchesEditorCommandChord(event({ key: 'r', altKey: true }), { key: 'r' }),
    ).toBe(false);
    expect(
      matchesEditorCommandChord(
        event({ key: 's', metaKey: true, altKey: true }),
        { key: 's', modifiers: ['mod'] },
      ),
    ).toBe(false);
  });
});
