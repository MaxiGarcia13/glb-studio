import type { EditorCommandId } from '../types/editor-command';

import { useEffect } from 'react';

import { runEditorCommand } from '../actions/run-editor-command';
import { isTypingTarget } from '../utils/is-typing-target';
import { resolveEditorCommandId } from '../utils/resolve-editor-command-id';

const NUDGE_IDS: ReadonlySet<EditorCommandId> = new Set([
  'nudgeNegX',
  'nudgePosX',
  'nudgePosY',
  'nudgeNegY',
  'nudgePosZ',
  'nudgeNegZ',
]);

/**
 * Single window keydown listener for the editor command catalog.
 * Absorbs / replaces `use-transform-mode-hotkeys`.
 */
export function useEditorCommandHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const id = resolveEditorCommandId(event);
      if (!id) {
        return;
      }

      // Allow key-repeat for nudge only (hold arrow to keep moving).
      if (event.repeat && !NUDGE_IDS.has(id)) {
        return;
      }

      event.preventDefault();
      runEditorCommand(id);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
