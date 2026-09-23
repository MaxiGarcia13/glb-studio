import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useRef, useState } from 'react';
import { ActionMenu } from '@/components/action-menu';
import { useCollapsible } from '@/components/collapsible';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { BoneIcon } from '@/components/icons/bone-icon';
import { EditIcon } from '@/components/icons/edit-icon';
import { ReplaceIcon } from '@/components/icons/replace-icon';
import { RetargetIcon } from '@/components/icons/retarget-icon';
import { TextureIcon } from '@/components/icons/texture-icon';
import { TrashIcon } from '@/components/icons/trash-icon';
import { openRetargetForModel } from '@/modules/animation/stores/retarget-ui-store';
import { applySkinnedSessionSkinsFromFiles } from '@/modules/create/actions/apply-skinned-session-skin';
import { skinCreatedModel } from '@/modules/create/actions/skin-created-model';
import { PART_COLOR_MAP_ACCEPT } from '@/modules/create/adapters/load-image-texture';
import { getSkinnedTextureAvailability } from '@/modules/create/domain/resolve-skinned-texture-target';
import { canSkinModel } from '@/modules/create/domain/skinning/can-skin-model';
import { $createPartsRevision } from '@/modules/create/stores/create-parts-revision-store';
import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

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
  const { object: selected } = useStore($selection, { keys: ['object'] });
  useStore($createPartsRevision);
  const [skinBusy, setSkinBusy] = useState(false);
  const [skinsBusy, setSkinsBusy] = useState(false);
  const skinsInputRef = useRef<HTMLInputElement>(null);

  const model = models.find((entry) => entry.id === modelId);
  const skinned = model ? isSkinnedLibraryModel(model) : false;
  const skinAvailability = model
    ? canSkinModel(model)
    : { enabled: false, reason: 'Model not found' };
  const skinDisabled = skinBusy || !skinAvailability.enabled;
  const textureAvailability = getSkinnedTextureAvailability(model, selected);
  const addSkinsDisabled = skinsBusy || !skinned || !textureAvailability.enabled;

  async function handleSkinsSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0 || !model || skinsBusy) {
      return;
    }

    const availability = getSkinnedTextureAvailability(model, selected);
    const target = availability.target;
    if (!target) {
      return;
    }

    setSkinsBusy(true);
    try {
      selectModel(modelId);
      setOpen(true);
      await applySkinnedSessionSkinsFromFiles({
        modelId,
        meshUuid: target.mesh.uuid,
        material: target.material,
        files,
      });
    } finally {
      setSkinsBusy(false);
    }
  }

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
    ...(skinned
      ? [{
        id: 'add-skins',
        label: skinsBusy ? 'Adding skins…' : 'Add skins',
        icon: <TextureIcon />,
        disabled: addSkinsDisabled,
        title: skinsBusy
          ? 'Adding skins…'
          : textureAvailability.enabled
            ? 'Add one or more color maps to this model'
            : textureAvailability.reason,
        onSelect: () => {
          skinsInputRef.current?.click();
        },
      } satisfies ActionMenuItem]
      : []),
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

  return (
    <>
      <input
        ref={skinsInputRef}
        type="file"
        accept={PART_COLOR_MAP_ACCEPT}
        multiple
        aria-hidden
        tabIndex={-1}
        className="sr-only"
        disabled={addSkinsDisabled}
        onChange={handleSkinsSelected}
      />
      <ActionMenu items={items} aria-label="Model actions" />
    </>
  );
}
