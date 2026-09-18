import type { EditorCommand } from '@/modules/commands/types/editor-command';

import { describe, expect, it } from 'vitest';
import { groupEditorCommandsByCategory } from '@/modules/commands/domain/group-editor-commands';

function command(
  partial: Pick<EditorCommand, 'id' | 'category'> & Partial<EditorCommand>,
): EditorCommand {
  return {
    chords: [{ key: 'x' }],
    label: partial.id,
    ...partial,
  };
}

describe('groupEditorCommandsByCategory', () => {
  it('returns an empty list for an empty catalog', () => {
    expect(groupEditorCommandsByCategory([])).toEqual([]);
  });

  it('groups consecutive same-category commands and splits on change', () => {
    const commands = [
      command({ id: 'playPause', category: 'Playback' }),
      command({ id: 'toggleAxes', category: 'Viewport' }),
      command({ id: 'toggleBones', category: 'Viewport' }),
      command({ id: 'transformMove', category: 'Transform' }),
      command({ id: 'undo', category: 'History' }),
      command({ id: 'redo', category: 'History' }),
    ];

    expect(groupEditorCommandsByCategory(commands)).toEqual([
      { category: 'Playback', commands: [commands[0]] },
      { category: 'Viewport', commands: [commands[1], commands[2]] },
      { category: 'Transform', commands: [commands[3]] },
      { category: 'History', commands: [commands[4], commands[5]] },
    ]);
  });

  it('starts a new group when the same category reappears after another', () => {
    const commands = [
      command({ id: 'toggleAxes', category: 'Viewport' }),
      command({ id: 'playPause', category: 'Playback' }),
      command({ id: 'toggleBones', category: 'Viewport' }),
    ];

    expect(groupEditorCommandsByCategory(commands)).toEqual([
      { category: 'Viewport', commands: [commands[0]] },
      { category: 'Playback', commands: [commands[1]] },
      { category: 'Viewport', commands: [commands[2]] },
    ]);
  });
});
