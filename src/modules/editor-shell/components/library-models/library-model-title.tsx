import type { UseAssetEntryRenameResult } from '@/components/asset-entry/use-asset-entry-rename';
import { cn } from '@maxigarcia/js-utils';
import { AssetEntryRenameInput } from '@/components/asset-entry/asset-entry-rename-input';
import { Text } from '@/components/text';
import { LibraryModelPreviewButton } from './library-model-preview-button';

interface LibraryModelTitleProps {
  fileName: string;
  rename: UseAssetEntryRenameResult;
  modelId: string;
  selected?: boolean;
  onSelect?: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
            onSelect?.(event);
          }}
          className="flex-1 min-w-0 text-left cursor-pointer"
          aria-pressed={selected}
          title={selected ? 'Deselect model' : 'Select model'}
        >
          <Text
            as="h2"
            variant="section"
            className={cn('truncate', selected && 'text-accent')}
          >
            {fileName}
          </Text>
        </button>

        <LibraryModelPreviewButton modelId={modelId} className="p-2" />
        {' '}

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
