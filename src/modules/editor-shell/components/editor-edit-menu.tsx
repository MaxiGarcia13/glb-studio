import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { ActionMenu } from '@/components/action-menu';
import { RedoIcon } from '@/components/icons/redo-icon';
import { UndoIcon } from '@/components/icons/undo-icon';
import {
  $canRedo,
  $canUndo,
} from '@/modules/animation/stores/undo-stack-store';
import {
  formatEditorCommandChord,
  formatEditorCommandChords,
  getEditorCommand,
  isMacPlatform,
  runEditorCommand,
} from '@/modules/commands';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';

interface EditorEditMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edit menu: undo / redo from the command catalog. */
export function EditorEditMenu({ open, onOpenChange }: EditorEditMenuProps) {
  const canUndoStack = useStore($canUndo);
  const canRedo = useStore($canRedo);
  const poseDirty = useStore($poseDirty);
  const canUndo = canUndoStack || poseDirty;
  const isMac = isMacPlatform();
  const undo = getEditorCommand('undo');
  const redo = getEditorCommand('redo');

  const undoShortcut = undo.chords[0];
  const redoShortcut = redo.chords[0];

  const items: ActionMenuItem[] = [
    {
      id: undo.id,
      label: undo.label,
      icon: <UndoIcon />,
      shortcut: undoShortcut
        ? formatEditorCommandChord(undoShortcut, isMac)
        : undefined,
      disabled: !canUndo,
      title: canUndo
        ? formatEditorCommandChords(undo, isMac)
        : 'Nothing to undo',
      onSelect: () => runEditorCommand('undo'),
    },
    {
      id: redo.id,
      label: redo.label,
      icon: <RedoIcon />,
      shortcut: redoShortcut
        ? formatEditorCommandChord(redoShortcut, isMac)
        : undefined,
      disabled: !canRedo,
      title: canRedo
        ? formatEditorCommandChords(redo, isMac)
        : 'Nothing to redo',
      onSelect: () => runEditorCommand('redo'),
    },
  ];


  return (
    <ActionMenu
      label="Edit"
      items={items}
      align="start"
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
