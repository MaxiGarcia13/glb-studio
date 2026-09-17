import { ActionMenuPanel } from '@/components/action-menu';
import { SnapControls } from './snap-controls';
import { WorldAxesControls } from './world-axes-controls';

interface EditorSettingsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Settings dropdown: world axes + snap. */
export function EditorSettingsMenu({ open, onOpenChange }: EditorSettingsMenuProps) {
  return (
    <ActionMenuPanel
      label="Settings"
      align="start"
      open={open}
      onOpenChange={onOpenChange}
      panelClassName="flex flex-col gap-6"
    >
      <WorldAxesControls />
      <SnapControls />
    </ActionMenuPanel>
  );
}
