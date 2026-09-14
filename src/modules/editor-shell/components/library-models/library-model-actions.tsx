import type { ActionMenuItem } from '@/components/action-menu';
import { ActionMenu } from '@/components/action-menu';
import { useCollapsible } from '@/components/collapsible';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { EditIcon } from '@/components/icons/edit-icon';
import { ReplaceIcon } from '@/components/icons/replace-icon';
import { RetargetIcon } from '@/components/icons/retarget-icon';
import { TrashIcon } from '@/components/icons/trash-icon';
import { openRetargetForModel } from '@/modules/animation/stores/retarget-ui-store';

interface LibraryModelActionsProps {
  modelId: string;
  conflictedClipIds: string[];
  onAddAnimation: () => void;
  onRename: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

export function LibraryModelActions({
  modelId,
  conflictedClipIds,
  onAddAnimation,
  onRename,
  onReplace,
  onRemove,
}: LibraryModelActionsProps) {
  const { setOpen } = useCollapsible();

  const items: ActionMenuItem[] = [
    ...(conflictedClipIds.length > 0
      ? [{
        id: 'retarget',
        label: 'Retarget clips',
        icon: <RetargetIcon />,
        onSelect: () => openRetargetForModel(modelId, conflictedClipIds),
      } satisfies ActionMenuItem]
      : []),
    {
      id: 'add-animation',
      label: 'Add animation',
      icon: <AnimationIcon />,
      onSelect: () => {
        setOpen(true);
        onAddAnimation();
      },
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: <EditIcon />,
      onSelect: onRename,
    },
    {
      id: 'replace',
      label: 'Replace',
      icon: <ReplaceIcon />,
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

  return <ActionMenu items={items} aria-label="Model actions" />;
}
