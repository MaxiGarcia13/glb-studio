import type { EditorCommandChord } from '../types/editor-command';
import { cn } from '@maxigarcia/js-utils';
import { Text } from '@/components/text';
import { chordToKeyboardKeyParts } from '../domain/chord-key-parts';
import { formatEditorCommandChord } from '../domain/editor-commands';
import { KEYBOARD_KEY_ICONS } from './keyboard-key-icons';

interface EditorCommandChordDisplayProps {
  chord: EditorCommandChord;
  isMac: boolean;
  className?: string;
}

/** Visual chord using per-key icons from `icons/keyboard`. */
export function EditorCommandChordDisplay({
  chord,
  isMac,
  className,
}: EditorCommandChordDisplayProps) {
  const parts = chordToKeyboardKeyParts(chord, isMac);

  return (
    <span
      className={cn('inline-flex items-center gap-2 text-fg-muted', className)}
      aria-label={formatEditorCommandChord(chord, isMac)}
    >
      {parts.map((part) => {
        const Icon = KEYBOARD_KEY_ICONS[part.id];
        return (
          <kbd
            key={`${part.id}-${part.label}`}
            aria-label={part.label}
            className="inline-flex items-center justify-center"
          >
            <Icon aria-hidden width={28} height={28} />
          </kbd>
        );
      })}
      {parts.length === 0 && (
        <Text variant="muted" className="font-mono">
          {formatEditorCommandChord(chord, isMac)}
        </Text>
      )}
    </span>
  );
}
