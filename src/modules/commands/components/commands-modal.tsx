import { Modal } from '@/components/modal';
import { Text } from '@/components/text';
import { EDITOR_COMMANDS } from '../domain/editor-commands';
import { groupEditorCommandsByCategory } from '../domain/group-editor-commands';
import { isMacPlatform } from '../utils/is-mac-platform';
import { EditorCommandChordsDisplay } from './editor-command-chord-display';

interface CommandsModalProps {
  open: boolean;
  onClose: () => void;
}

const GROUPS = groupEditorCommandsByCategory(EDITOR_COMMANDS);

/** Lists every catalog command with its live chords — no second hardcoded list. */
export function CommandsModal({ open, onClose }: CommandsModalProps) {
  const isMac = isMacPlatform();

  return (
    <Modal open={open} title="Commands" onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-6">
        {GROUPS.map((group) => (
          <section key={group.category} className="flex flex-col gap-2">
            <Text as="h2" variant="section">
              {group.category}
            </Text>
            <ul className="flex flex-col gap-2">
              {group.commands.map((command) => (
                <li
                  key={command.id}
                  className="flex items-center justify-between gap-4"
                >
                  <Text>{command.label}</Text>
                  <EditorCommandChordsDisplay
                    command={command}
                    isMac={isMac}
                    className="shrink-0"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
