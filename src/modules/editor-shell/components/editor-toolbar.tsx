import { useState } from 'react';
import { useEditorCommandHotkeys } from '@/modules/commands';
import { CommandsMenuButton } from './commands-menu-button';
import { EditorEditMenu } from './editor-edit-menu';
import { EditorFileMenu } from './editor-file-menu';
import { EditorSettingsMenu } from './editor-settings-menu';
import { SelectionContextMenu } from './selection-context-menu';

type OpenMenu = 'file' | 'edit' | 'settings' | null;

/** Full-width Blender-style app menu bar (File / Edit / Settings / Commands). */
export function EditorToolbar() {
  useEditorCommandHotkeys();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  return (
    <header
      role="menubar"
      aria-label="Editor menu"
      className="flex items-center gap-1 border-b border-border bg-surface px-2 py-1"
    >
      <EditorFileMenu
        open={openMenu === 'file'}
        onOpenChange={(open) => setOpenMenu(open ? 'file' : null)}
      />
      <EditorEditMenu
        open={openMenu === 'edit'}
        onOpenChange={(open) => setOpenMenu(open ? 'edit' : null)}
      />
      <EditorSettingsMenu
        open={openMenu === 'settings'}
        onOpenChange={(open) => setOpenMenu(open ? 'settings' : null)}
      />
      <CommandsMenuButton onOpen={() => setOpenMenu(null)} />
      <SelectionContextMenu />
    </header>
  );
}
