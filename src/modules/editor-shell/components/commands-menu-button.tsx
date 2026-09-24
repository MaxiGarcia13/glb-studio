import { useState } from 'react';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { LazyCommandsModal } from '@/modules/commands';

interface CommandsMenuButtonProps {
  /** Called when opening Commands so sibling menus can close. */
  onOpen?: () => void;
}

/** Menubar trigger that opens the Commands modal. */
export function CommandsMenuButton({ onOpen }: CommandsMenuButtonProps) {
  const [commandsOpen, setCommandsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className="px-2 py-1"
        aria-haspopup="dialog"
        aria-expanded={commandsOpen}
        onClick={() => {
          onOpen?.();
          setCommandsOpen(true);
        }}
      >
        <Text as="span" className="text-current">
          Commands
        </Text>
      </Button>
      <LazyCommandsModal open={commandsOpen} onClose={() => setCommandsOpen(false)} />
    </>
  );
}
