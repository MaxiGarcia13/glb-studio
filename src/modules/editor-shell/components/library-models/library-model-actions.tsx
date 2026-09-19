import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ActionMenu } from '@/components/action-menu';
import { useCollapsible } from '@/components/collapsible';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { BoneIcon } from '@/components/icons/bone-icon';
import { EditIcon } from '@/components/icons/edit-icon';
import { ReplaceIcon } from '@/components/icons/replace-icon';
import { RetargetIcon } from '@/components/icons/retarget-icon';
import { TrashIcon } from '@/components/icons/trash-icon';
import { openRetargetForModel } from '@/modules/animation/stores/retarget-ui-store';
import { skinCreatedModel } from '@/modules/create/actions/skin-created-model';
import { canSkinModel } from '@/modules/create/domain/skinning/can-skin-model';
import { $createPartsRevision } from '@/modules/create/stores/create-parts-revision-store';
import { $model } from '@/modules/viewport/stores/model-store';

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
  const { models } = useStore($model, { keys: ['models'] });
  useStore($createPartsRevision);
  const [skinBusy, setSkinBusy] = useState(false);

  const model = models.find((entry) => entry.id === modelId);
  const skinAvailability = model
    ? canSkinModel(model)
    : { enabled: false, reason: 'Model not found' };
  const skinDisabled = skinBusy || !skinAvailability.enabled;

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
      id: 'skin-model',
      label: skinBusy ? 'Skinning…' : 'Skin model',
      icon: <BoneIcon />,
      disabled: skinDisabled,
      title: skinBusy ? 'Skinning…' : skinAvailability.reason,
      onSelect: () => {
        setSkinBusy(true);
        try {
          skinCreatedModel(modelId);
        } finally {
          setSkinBusy(false);
        }
      },
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
