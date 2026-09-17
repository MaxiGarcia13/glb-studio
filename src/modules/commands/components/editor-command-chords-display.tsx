import type { EditorCommand } from '../types/editor-command';
import { cn } from '@maxigarcia/js-utils';
import { Text } from '@/components/text';
import { EditorCommandChordDisplay } from './editor-command-chord-display';

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
