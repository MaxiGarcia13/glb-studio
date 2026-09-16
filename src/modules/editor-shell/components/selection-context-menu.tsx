import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { PointerActionMenu } from '@/components/action-menu';
import {
  getGroupPartsAvailability,
  groupSelectedParts,
} from '@/modules/create/actions/group-selected-parts';
import {
  getUngroupPartsAvailability,
  ungroupSelectedParts,
} from '@/modules/create/actions/ungroup-selected-parts';
import {
  getGroupModelsAvailability,
  groupSelectedModels,
} from '@/modules/viewport/actions/group-selected-models';
import {
  getUngroupModelsAvailability,
  ungroupSelectedModels,
} from '@/modules/viewport/actions/ungroup-selected-models';
import {
  $selectionContextMenu,
  closeSelectionContextMenu,
} from '@/modules/viewport/stores/selection-context-menu-store';
import { $modelGroups } from '@/modules/viewport/stores/model-group-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

function buildMenuItems(): ActionMenuItem[] {
  const { kind } = $selection.get();

  if (kind === 'models') {
    const groupModels = getGroupModelsAvailability();
    const ungroupModels = getUngroupModelsAvailability();
    return [
      {
        id: 'group',
        label: 'Group',
        disabled: !groupModels.enabled,
        title: groupModels.reason,
        onSelect: () => {
          groupSelectedModels();
        },
      },
      {
        id: 'ungroup',
        label: 'Ungroup',
        disabled: !ungroupModels.enabled,
        title: ungroupModels.reason,
        onSelect: () => {
          ungroupSelectedModels();
        },
      },
    ];
  }

  const groupParts = getGroupPartsAvailability();
  const ungroupParts = getUngroupPartsAvailability();
  return [
    {
      id: 'group',
      label: 'Group',
      disabled: !groupParts.enabled,
      title: groupParts.reason,
      onSelect: () => {
        groupSelectedParts();
      },
    },
    {
      id: 'ungroup',
      label: 'Ungroup',
      disabled: !ungroupParts.enabled,
      title: ungroupParts.reason,
      onSelect: () => {
        ungroupSelectedParts();
      },
    },
  ];
}

/** Portal host for the selection context menu (mount once — e.g. EditorToolbar). */
export function SelectionContextMenu() {
  const menu = useStore($selectionContextMenu);
  useStore($selection, { keys: ['kind', 'object', 'objects', 'modelIds'] });
  useStore($modelGroups, { keys: ['groups'] });
  const onClose = useCallback(() => {
    closeSelectionContextMenu();
  }, []);

  const items = menu.open ? buildMenuItems() : [];

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
