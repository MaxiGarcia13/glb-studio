import type { ActionMenuItem } from '@/components/action-menu';
import { ActionMenu } from '@/components/action-menu';
import { EditIcon } from '@/components/icons/edit-icon';
import { ReplaceIcon } from '@/components/icons/replace-icon';
import { TrashIcon } from '@/components/icons/trash-icon';

interface AssetEntryActionsProps {
  /** Optional leading menu item (e.g. Retarget). */
  primaryAction?: Omit<ActionMenuItem, 'id'> & { id?: string };
  canRename: boolean;
  editing: boolean;
  replaceDisabled: boolean;
  onStartRename: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

export function AssetEntryActions({
  primaryAction,
  canRename,
  editing,
  replaceDisabled,
  onStartRename,
  onReplace,
  onRemove,
}: AssetEntryActionsProps) {
  const items: ActionMenuItem[] = [
    ...(primaryAction
      ? [{
        id: primaryAction.id ?? 'primary',
        label: primaryAction.label,
        icon: primaryAction.icon,
        disabled: primaryAction.disabled,
        danger: primaryAction.danger,
        onSelect: primaryAction.onSelect,
      } satisfies ActionMenuItem]
      : []),
    ...(canRename && !editing
      ? [{
        id: 'rename',
        label: 'Rename',
        icon: <EditIcon />,
        onSelect: onStartRename,
      } satisfies ActionMenuItem]
      : []),
    {
      id: 'replace',
      label: 'Replace',
      icon: <ReplaceIcon />,
      disabled: replaceDisabled,
      onSelect: onReplace,
    },
    {
      id: 'remove',
      label: 'Remove',
      icon: <TrashIcon />,
      danger: true,
      onSelect: onRemove,
    },
  ];

  return <ActionMenu items={items} aria-label="Clip actions" />;
}
