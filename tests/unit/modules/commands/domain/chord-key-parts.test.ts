import { describe, expect, it } from 'vitest';

import { chordToKeyboardKeyParts } from '@/modules/commands/domain/chord-key-parts';

describe('chordToKeyboardKeyParts', () => {
  it('returns letter key parts for known catalog letters', () => {
    expect(chordToKeyboardKeyParts({ key: 'q' }, true)).toEqual([
      { id: 'q', label: 'Q' },
    ]);
  });

  it('maps named keys to icon ids', () => {
    expect(chordToKeyboardKeyParts({ key: ' ' }, false)).toEqual([
      { id: 'space', label: 'Space' },
    ]);
    expect(chordToKeyboardKeyParts({ key: 'ArrowLeft' }, true)).toEqual([
      { id: 'arrow_left', label: '←' },
    ]);
    expect(chordToKeyboardKeyParts({ key: 'Delete' }, false)).toEqual([
      { id: 'delete', label: 'Delete' },
    ]);
  });

  it('orders mod then shift then key, with platform-specific mod', () => {
    expect(
      chordToKeyboardKeyParts(
        { key: 'z', modifiers: ['mod', 'shift'] },
        true,
      ),
    ).toEqual([
      { id: 'command', label: 'Command' },
      { id: 'shift', label: 'Shift' },
      { id: 'z', label: 'Z' },
    ]);

    expect(
      chordToKeyboardKeyParts(
        { key: 'z', modifiers: ['mod', 'shift'] },
        false,
      ),
    ).toEqual([
      { id: 'ctrl', label: 'Ctrl' },
      { id: 'shift', label: 'Shift' },
      { id: 'z', label: 'Z' },
    ]);
  });

  it('omits the key part when there is no matching icon id', () => {
    expect(
      chordToKeyboardKeyParts({ key: 'x', modifiers: ['mod'] }, true),
    ).toEqual([{ id: 'command', label: 'Command' }]);
  });
});
