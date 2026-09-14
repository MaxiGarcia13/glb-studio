import type { UseAssetEntryRenameResult } from '@/components/asset-entry/use-asset-entry-rename';
import { AssetEntryRenameInput } from '@/components/asset-entry/asset-entry-rename-input';
import { Text } from '@/components/text';
import { LibraryModelPreviewButton } from './library-model-preview-button';

interface LibraryModelTitleProps {
  fileName: string;
  rename: UseAssetEntryRenameResult;
  modelId: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function LibraryModelTitle({
  fileName,
  modelId,
  rename,
  selected = false,
  onSelect,
}: LibraryModelTitleProps) {
  if (!rename.editing) {
    return (
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.();
          }}
          className="flex-1 min-w-0 text-left cursor-pointer"
          aria-pressed={selected}
          title="Select model"
        >
          <Text as="h2" variant="section" className="truncate">
            {fileName}
          </Text>
        </button>

        <LibraryModelPreviewButton modelId={modelId} className="p-1" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0" onClick={(event) => event.stopPropagation()}>
      <AssetEntryRenameInput
        inputRef={rename.inputRef}
        value={rename.draft}
        onChange={rename.setDraft}
        onCommit={rename.commit}
        onCancel={rename.cancel}
      />
    </div>
  );
}
