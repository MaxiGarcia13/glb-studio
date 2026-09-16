import type { Object3D } from 'three';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { AssetEntryRenameInput } from '@/components/asset-entry/asset-entry-rename-input';
import { useAssetEntryRename } from '@/components/asset-entry/use-asset-entry-rename';
import { Text } from '@/components/text';
import { renameSelectedObject } from '@/modules/viewport/actions/rename-selected-object';
import { $selection } from '@/modules/viewport/stores/selection-store';

function SelectionNameEditor({ object }: { object: Object3D }) {
  const label = object.name;

  const {
    draft,
    inputRef,
    setDraft,
    startEditing,
    commit,
    cancel,
  } = useAssetEntryRename({
    label,
    onRename: renameSelectedObject,
  });

  // Remount via parent `key` resets state; re-enter when the committed name changes.
  useEffect(() => {
    startEditing();
  }, [label, startEditing]);

  return (
    <div className="flex flex-col gap-2">
      <Text variant="muted">Name</Text>
      <AssetEntryRenameInput
        inputRef={inputRef}
        value={draft}
        onChange={setDraft}
        onCommit={commit}
        onCancel={cancel}
      />
    </div>
  );
}

/**
 * Settings Name field for the current selection (any mesh or bone).
 * Enter / blur commit, Escape cancel — same hook as library rename.
 */
export function SelectionNameField() {
  const { object: selected } = useStore($selection, { keys: ['object'] });

  if (!selected) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Text as="h2" variant="section">
        Selection
      </Text>
      <SelectionNameEditor key={selected.uuid} object={selected} />
    </div>
  );
}
