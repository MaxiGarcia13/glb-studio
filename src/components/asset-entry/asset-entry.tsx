import type { AssetEntryProps } from './types';
import { cn } from '@maxigarcia/js-utils';
import { AssetEntryActions } from './asset-entry-actions';
import { AssetEntryHeader } from './asset-entry-header';
import { AssetEntryRenameInput } from './asset-entry-rename-input';
import { useAssetEntryRename } from './use-asset-entry-rename';

export function AssetEntry({
  label,
  title,
  leading,
  description,
  errorDetail,
  status,
  statusLabel,
  onReplace,
  onRemove,
  replaceDisabled = false,
  selected = false,
  onSelect,
  primaryAction,
  onRename,
}: AssetEntryProps) {
  const hasError = status === 'error';
  const {
    canRename,
    editing,
    draft,
    inputRef,
    setDraft,
    startEditing,
    commit,
    cancel,
  } = useAssetEntryRename({ label, onRename });

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-sm p-2 ring-1',
        selected
          ? 'bg-zinc-900 ring-zinc-700'
          : hasError
            ? 'bg-zinc-800/40 ring-amber-500/25'
            : 'bg-zinc-800/40 ring-zinc-700/80',
      )}
    >
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
            <AssetEntryHeader
              label={label}
              title={title}
              leading={leading}
              description={description}
              errorDetail={errorDetail}
              status={status}
              statusLabel={statusLabel}
              canRename={canRename}
              onSelect={onSelect}
              onStartRename={startEditing}
            />
          )}

      <AssetEntryActions
        primaryAction={primaryAction}
        canRename={canRename}
        editing={editing}
        replaceDisabled={replaceDisabled}
        onStartRename={startEditing}
        onReplace={onReplace}
        onRemove={onRemove}
      />
    </div>
  );
}
