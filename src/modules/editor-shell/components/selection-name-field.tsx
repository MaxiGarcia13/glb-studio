import type { Object3D } from 'three';
import { useStore } from '@nanostores/react';
import { AssetEntryRenameInput } from '@/components/asset-entry/asset-entry-rename-input';
import { useAssetEntryRename } from '@/components/asset-entry/use-asset-entry-rename';
import { Text } from '@/components/text';
import { renameSelectedObject } from '@/modules/viewport/actions/rename-selected-object';
import { $selection } from '@/modules/viewport/stores/selection-store';

function SelectionNameEditor({ object }: { object: Object3D }) {
  const label = object.name;

  const {
    editing,
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

  return (
    <div className="flex flex-col gap-2">
      <Text variant="muted">Name</Text>
      {editing
        ? (
            <AssetEntryRenameInput
              inputRef={inputRef}
              value={draft}
              onChange={setDraft}
              onCommit={commit}
              onCancel={cancel}
            />
          )
        : (
            <button
              type="button"
              onClick={startEditing}
              aria-label={`Rename ${label || 'selection'}`}
              title="Rename"
              className="w-full min-w-0 rounded-sm bg-control px-2 py-2 text-left text-xs text-fg truncate"
            >
              {label || 'Unnamed'}
            </button>
          )}
    </div>
  );
}

/**
 * Settings Name field for the current selection (any mesh or bone).
 * Click to edit; Enter / blur commit, Escape cancel — same hook as library rename.
 * Stays out of edit mode by default so editor hotkeys keep working (US-10).
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
