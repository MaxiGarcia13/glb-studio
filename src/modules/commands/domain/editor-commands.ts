import type {
  EditorCommand,
  EditorCommandChord,
  EditorCommandId,
} from '../types/editor-command';
import { EDITOR_COMMANDS } from './editor-command-catalog';

export { EDITOR_COMMANDS } from './editor-command-catalog';

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
  'Backspace': 'Backspace',
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

  const key = KEY_LABELS[chord.key]
    ?? (chord.key.length === 1 ? chord.key.toUpperCase() : chord.key);
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
