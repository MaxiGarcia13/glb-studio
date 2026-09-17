import type { EditorCommandChord } from '../types/editor-command';

/** Normalize `KeyboardEvent.key` for catalog comparison (letters lowercased). */
export function normalizeEventKey(key: string): string {
  if (key.length === 1) {
    return key.toLowerCase();
  }
  return key;
}

/**
 * Exact chord match: required mod/shift must be present; extras fail.
 * `mod` = meta or ctrl. Alt never matches a catalog chord.
 */
export function matchesEditorCommandChord(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
  chord: EditorCommandChord,
): boolean {
  if (event.altKey) {
    return false;
  }

  if (normalizeEventKey(event.key) !== normalizeEventKey(chord.key)) {
    return false;
  }

  const modifiers = chord.modifiers ?? [];
  const wantsMod = modifiers.includes('mod');
  const wantsShift = modifiers.includes('shift');
  const hasMod = event.metaKey || event.ctrlKey;

  if (wantsMod !== hasMod) {
    return false;
  }
  if (wantsShift !== event.shiftKey) {
    return false;
  }

  return true;
}
