import type { EditorCommand, EditorCommandChord } from '../types/editor-command';
import type { IconProps } from '@/components/icons/type';
import { cn } from '@maxigarcia/js-utils';
import {
  KeyboardArrowDownIcon,
  KeyboardArrowLeftIcon,
  KeyboardArrowRightIcon,
  KeyboardArrowUpIcon,
  KeyboardBIcon,
  KeyboardCIcon,
  KeyboardCommandIcon,
  KeyboardCtrlIcon,
  KeyboardDeleteIcon,
  KeyboardEIcon,
  KeyboardQIcon,
  KeyboardRIcon,
  KeyboardShiftIcon,
  KeyboardSIcon,
  KeyboardSpaceIcon,
  KeyboardVIcon,
  KeyboardWIcon,
  KeyboardYIcon,
  KeyboardZIcon,
} from '@/components/icons/keyboard';
import { Text } from '@/components/text';
import { formatEditorCommandChord } from '../domain/editor-commands';

type KeyboardKeyId
  = | 'command'
    | 'ctrl'
    | 'shift'
    | 'space'
    | 'q'
    | 'w'
    | 'e'
    | 'r'
    | 'b'
    | 's'
    | 'c'
    | 'v'
    | 'z'
    | 'y'
    | 'arrow_left'
    | 'arrow_right'
    | 'arrow_up'
    | 'arrow_down'
    | 'delete';

const KEYBOARD_KEY_ICONS: Record<
  KeyboardKeyId,
  (props: IconProps) => React.ReactNode
> = {
  command: KeyboardCommandIcon,
  ctrl: KeyboardCtrlIcon,
  shift: KeyboardShiftIcon,
  space: KeyboardSpaceIcon,
  q: KeyboardQIcon,
  w: KeyboardWIcon,
  e: KeyboardEIcon,
  r: KeyboardRIcon,
  b: KeyboardBIcon,
  s: KeyboardSIcon,
  c: KeyboardCIcon,
  v: KeyboardVIcon,
  z: KeyboardZIcon,
  y: KeyboardYIcon,
  arrow_left: KeyboardArrowLeftIcon,
  arrow_right: KeyboardArrowRightIcon,
  arrow_up: KeyboardArrowUpIcon,
  arrow_down: KeyboardArrowDownIcon,
  delete: KeyboardDeleteIcon,
};

interface EditorCommandChordDisplayProps {
  chord: EditorCommandChord;
  isMac: boolean;
  className?: string;
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
  if (chord.key === 'Delete') {
    return 'delete';
  }
  if (chord.key.length === 1) {
    const letter = chord.key.toLowerCase();
    if (letter in KEYBOARD_KEY_ICONS) {
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

/** Visual chord using per-key icons from `icons/keyboard`. */
export function EditorCommandChordDisplay({
  chord,
  isMac,
  className,
}: EditorCommandChordDisplayProps) {
  const modifiers = chord.modifiers ?? [];
  const parts: { id: KeyboardKeyId; label: string }[] = [];

  if (modifiers.includes('mod')) {
    const id = resolveKeyId(chord, 'mod', isMac)!;
    parts.push({ id, label: keyLabel(id) });
  }
  if (modifiers.includes('shift')) {
    parts.push({ id: 'shift', label: 'Shift' });
  }

  const keyId = resolveKeyId(chord, 'key', isMac);
  if (keyId) {
    parts.push({ id: keyId, label: keyLabel(keyId) });
  }

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

interface EditorCommandChordsDisplayProps {
  command: EditorCommand;
  isMac: boolean;
  className?: string;
}

/** All chords for a command (e.g. redo has two), separated visually. */
export function EditorCommandChordsDisplay({
  command,
  isMac,
  className,
}: EditorCommandChordsDisplayProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center justify-end gap-2', className)}>
      {command.chords.map((chord, index) => (
        <span key={chord.key.toString()} className="inline-flex items-center gap-2">
          {index > 0 && (
            <Text variant="muted" aria-hidden>
              ,
            </Text>
          )}
          <EditorCommandChordDisplay chord={chord} isMac={isMac} />
        </span>
      ))}
    </span>
  );
}
