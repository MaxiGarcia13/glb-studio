import { useStore } from '@nanostores/react';
import { ActionMenu } from '@/components/action-menu';
import { BlocksIcon } from '@/components/icons/blocks-icon';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { addPart } from '../actions/add-part';
import { listPartKinds } from '../domain/part-kind';

/**
 * Add-part menu for the create rail: one entry per registered kind.
 * Caller mounts only when a created model is focused.
 */
export function AddPartPalette() {
  const activeModel = useStore($activeModel);
  const kinds = listPartKinds();

  if (!activeModel || activeModel.source !== 'created') {
    return null;
  }

  const modelId = activeModel.id;

  return (
    <ActionMenu
      aria-label="Add part"
      side="top"
      align="start"
      icon={<BlocksIcon aria-hidden />}
      items={kinds.map((kind) => ({
        id: kind.id,
        label: kind.label,
        onSelect: () => addPart(modelId, kind.id),
      }))}
    />
  );
}
