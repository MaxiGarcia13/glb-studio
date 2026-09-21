import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { PointerActionMenu } from '@/components/action-menu';
import {
  getGroupPartsAvailability,
  groupSelectedParts,
} from '@/modules/create/actions/group-selected-parts';
import { getMakeJointAvailability } from '@/modules/create/actions/make-joint-selected-parts';
import {
  getUngroupPartsAvailability,
  ungroupSelectedParts,
} from '@/modules/create/actions/ungroup-selected-parts';
import {
  getUnjointPartsAvailability,
  unjointSelectedParts,
} from '@/modules/create/actions/unjoint-selected-parts';
import { MakeJointModal } from '@/modules/create/components/make-joint-modal';
import { openMakeJointModal } from '@/modules/create/stores/make-joint-ui-store';
import {
  getGroupModelsAvailability,
  groupSelectedModels,
} from '@/modules/viewport/actions/group-selected-models';
import {
  getUngroupModelsAvailability,
  ungroupSelectedModels,
} from '@/modules/viewport/actions/ungroup-selected-models';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $modelGroups } from '@/modules/viewport/stores/model-group-store';
import { $model } from '@/modules/viewport/stores/model-store';
import {
  $selectionContextMenu,
  closeSelectionContextMenu,
} from '@/modules/viewport/stores/selection-context-menu-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

function buildMenuItems(): ActionMenuItem[] {
  const { kind, objects } = $selection.get();

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

  // Part hierarchy actions only on created models (hidden after US-34 skin).
  const anchor = objects[0];
  const owner = anchor
    ? findModelEntryForObject(anchor, $model.get().models)
    : null;
  if (!owner || owner.source !== 'created') {
    return [];
  }

  const groupParts = getGroupPartsAvailability();
  const ungroupParts = getUngroupPartsAvailability();
  const makeJoint = getMakeJointAvailability();
  const unjoint = getUnjointPartsAvailability();
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
    {
      id: 'make-joint',
      label: 'Make connector',
      disabled: !makeJoint.enabled,
      title: makeJoint.reason,
      onSelect: () => {
        openMakeJointModal();
      },
    },
    {
      id: 'unjoint',
      label: 'Unjoint',
      disabled: !unjoint.enabled,
      title: unjoint.reason,
      onSelect: () => {
        unjointSelectedParts();
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
    <>
      <PointerActionMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={items}
        onClose={onClose}
        aria-label="Selection actions"
      />
      <MakeJointModal />
    </>
  );
}
