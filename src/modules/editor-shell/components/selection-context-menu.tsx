import type { ActionMenuItem } from '@/components/action-menu';
import type { SelectionState } from '@/modules/viewport/types/selection';
import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { PointerActionMenu } from '@/components/action-menu';
import {
  $selectionContextMenu,
  closeSelectionContextMenu,
} from '@/modules/viewport/stores/selection-context-menu-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

/**
 * Stub Group / Ungroup entries for the shell.
 * Wired in later US-26 tasks; disabled with a clear reason until then.
 */
function buildStubItems(selection: SelectionState): ActionMenuItem[] {
  const { kind, objects, modelIds } = selection;
  const count = kind === 'parts'
    ? objects.length
    : kind === 'models'
      ? modelIds.length
      : 0;

  const reason = count < 1
    ? 'Select parts or models first'
    : 'Grouping actions coming next';

  return [
    {
      id: 'group',
      label: 'Group',
      disabled: true,
      title: reason,
      onSelect: () => {},
    },
    {
      id: 'ungroup',
      label: 'Ungroup',
      disabled: true,
      title: reason,
      onSelect: () => {},
    },
  ];
}

/** Portal host for the selection context menu (mount once — e.g. EditorToolbar). */
export function SelectionContextMenu() {
  const menu = useStore($selectionContextMenu);
  const selection = useStore($selection);
  const onClose = useCallback(() => {
    closeSelectionContextMenu();
  }, []);

  const items = menu.open ? buildStubItems(selection) : [];

  return (
    <PointerActionMenu
      open={menu.open}
      x={menu.x}
      y={menu.y}
      items={items}
      onClose={onClose}
      aria-label="Selection actions"
    />
  );
}
