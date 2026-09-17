import type { EditorCommandId } from '../types/editor-command';

import { EDITOR_COMMANDS } from '../domain/editor-commands';
import { matchesEditorCommandChord } from './match-editor-command-chord';

/** First catalog command whose chord matches the keyboard event, or null. */
export function resolveEditorCommandId(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): EditorCommandId | null {
  for (const command of EDITOR_COMMANDS) {
    for (const chord of command.chords) {
      if (matchesEditorCommandChord(event, chord)) {
        return command.id;
      }
    }
  }
  return null;
}
