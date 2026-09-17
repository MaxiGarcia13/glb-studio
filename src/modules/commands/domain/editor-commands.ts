import type {
  EditorCommand,
  EditorCommandChord,
  EditorCommandId,
} from '../types/editor-command';

/**
 * Pure editor command catalog — single source of truth for chords, labels, and
 * categories (hotkeys + Commands modal). No store writes.
 *
 * @see specs/us-10/design.md — Keymap (locked)
 */
export const EDITOR_COMMANDS: readonly EditorCommand[] = [
  {
    id: 'playPause',
    chords: [{ key: ' ' }],
    label: 'Play / Pause',
    category: 'Playback',
  },
  {
    id: 'toggleAxes',
    chords: [{ key: 'r' }],
    label: 'Toggle world axes',
    category: 'Viewport',
  },
  {
    id: 'transformMove',
    chords: [{ key: 'q' }],
    label: 'Move',
    category: 'Transform',
  },
  {
    id: 'transformRotate',
    chords: [{ key: 'w' }],
    label: 'Rotate',
    category: 'Transform',
  },
  {
    id: 'transformScale',
    chords: [{ key: 'e' }],
    label: 'Scale',
    category: 'Transform',
  },
  {
    id: 'nudgeNegX',
    chords: [{ key: 'ArrowLeft' }],
    label: 'Nudge −X',
    category: 'Transform',
  },
  {
    id: 'nudgePosX',
    chords: [{ key: 'ArrowRight' }],
    label: 'Nudge +X',
    category: 'Transform',
  },
  {
    id: 'nudgePosY',
    chords: [{ key: 'ArrowUp' }],
    label: 'Nudge +Y',
    category: 'Transform',
  },
  {
    id: 'nudgeNegY',
    chords: [{ key: 'ArrowDown' }],
    label: 'Nudge −Y',
    category: 'Transform',
  },
  {
    id: 'nudgePosZ',
    chords: [{ key: 'ArrowUp', modifiers: ['shift'] }],
    label: 'Nudge +Z',
    category: 'Transform',
  },
  {
    id: 'nudgeNegZ',
    chords: [{ key: 'ArrowDown', modifiers: ['shift'] }],
    label: 'Nudge −Z',
    category: 'Transform',
  },
  {
    id: 'savePending',
    chords: [{ key: 's', modifiers: ['mod'] }],
    label: 'Save pending change',
    category: 'Animation',
  },
  {
    id: 'copyCreatePart',
    chords: [{ key: 'c', modifiers: ['mod'] }],
    label: 'Copy create part',
    category: 'Create',
  },
  {
    id: 'pasteCreatePart',
    chords: [{ key: 'v', modifiers: ['mod'] }],
    label: 'Paste create part',
    category: 'Create',
  },
  {
    id: 'deleteCreatePart',
    chords: [{ key: 'Delete' }],
    label: 'Delete create part',
    category: 'Create',
  },
  {
    id: 'undo',
    chords: [{ key: 'z', modifiers: ['mod'] }],
    label: 'Undo',
    category: 'History',
  },
  {
    id: 'redo',
    chords: [
      { key: 'z', modifiers: ['mod', 'shift'] },
      { key: 'y', modifiers: ['mod'] },
    ],
    label: 'Redo',
    category: 'History',
  },
];

const BY_ID: ReadonlyMap<EditorCommandId, EditorCommand> = new Map(
  EDITOR_COMMANDS.map((command) => [command.id, command]),
);

export function getEditorCommand(id: EditorCommandId): EditorCommand {
  const command = BY_ID.get(id);
  if (!command) {
    throw new Error(`Unknown editor command: ${id}`);
  }
  return command;
}

const KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  'ArrowLeft': '←',
  'ArrowRight': '→',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'Delete': 'Delete',
};

/** Human-readable chord for docs / Commands modal (`isMac` picks ⌘ vs Ctrl). */
export function formatEditorCommandChord(
  chord: EditorCommandChord,
  isMac: boolean,
): string {
  const parts: string[] = [];
  const modifiers = chord.modifiers ?? [];

  if (modifiers.includes('mod')) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (modifiers.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  const key = chord.key.length === 1
    ? chord.key.toUpperCase()
    : (KEY_LABELS[chord.key] ?? chord.key);
  parts.push(key);

  return parts.join(isMac ? '' : '+');
}

/** All display chords for a command, joined for a single label cell. */
export function formatEditorCommandChords(
  command: EditorCommand,
  isMac: boolean,
): string {
  return command.chords
    .map((chord) => formatEditorCommandChord(chord, isMac))
    .join(', ');
}
