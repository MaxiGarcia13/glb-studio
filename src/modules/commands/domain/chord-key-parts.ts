import type { EditorCommandChord } from '../types/editor-command';
import type { KeyboardKeyId } from '../types/keyboard-key-id';

/** Letter / digit keys that have a matching keyboard icon in the chord UI. */
const ICON_KEY_IDS = new Set<string>([
  '1',
  '2',
  '3',
  'q',
  'w',
  'e',
  'r',
  'b',
  's',
  'n',
  'c',
  'v',
  'z',
  'y',
]);

export interface KeyboardKeyPart {
  id: KeyboardKeyId;
  label: string;
}

function resolveKeyId(
  chord: EditorCommandChord,
  part: 'mod' | 'shift' | 'key',
  isMac: boolean,
): KeyboardKeyId | null {
  if (part === 'mod') {
    return isMac ? 'command' : 'ctrl';
  }
  if (part === 'shift') {
    return 'shift';
  }

  if (chord.key === ' ') {
    return 'space';
  }
  if (chord.key === 'ArrowLeft') {
    return 'arrow_left';
  }
  if (chord.key === 'ArrowRight') {
    return 'arrow_right';
  }
  if (chord.key === 'ArrowUp') {
    return 'arrow_up';
  }
  if (chord.key === 'ArrowDown') {
    return 'arrow_down';
  }
  if (chord.key === 'Delete' || chord.key === 'Backspace') {
    return 'delete';
  }
  if (chord.key.length === 1) {
    const letter = chord.key.toLowerCase();
    if (ICON_KEY_IDS.has(letter)) {
      return letter as KeyboardKeyId;
    }
  }
  return null;
}

function keyLabel(id: KeyboardKeyId): string {
  switch (id) {
    case 'command':
      return 'Command';
    case 'ctrl':
      return 'Ctrl';
    case 'shift':
      return 'Shift';
    case 'space':
      return 'Space';
    case 'arrow_left':
      return '←';
    case 'arrow_right':
      return '→';
    case 'arrow_up':
      return '↑';
    case 'arrow_down':
      return '↓';
    case 'delete':
      return 'Delete';
    default:
      return id.toUpperCase();
  }
}

/** Ordered key parts for icon chord UI (`mod` → `shift` → key). */
export function chordToKeyboardKeyParts(
  chord: EditorCommandChord,
  isMac: boolean,
): KeyboardKeyPart[] {
  const modifiers = chord.modifiers ?? [];
  const parts: KeyboardKeyPart[] = [];

  if (modifiers.includes('mod')) {
    const id = resolveKeyId(chord, 'mod', isMac)!;
    parts.push({ id, label: keyLabel(id) });
  }
  if (modifiers.includes('shift')) {
    parts.push({ id: 'shift', label: keyLabel('shift') });
  }

  const keyId = resolveKeyId(chord, 'key', isMac);
  if (keyId) {
    parts.push({ id: keyId, label: keyLabel(keyId) });
  }

  return parts;
}
