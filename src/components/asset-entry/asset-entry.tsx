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

  const actions = (
    <AssetEntryActions
      primaryAction={primaryAction}
      canRename={canRename}
      editing={editing}
      replaceDisabled={replaceDisabled}
      onStartRename={startEditing}
      onReplace={onReplace}
      onRemove={onRemove}
    />
  );

  const body = editing
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
          description={hasError ? description : null}
          errorDetail={errorDetail}
          status={status}
          statusLabel={statusLabel}
          canRename={canRename}
          onSelect={onSelect}
          onStartRename={startEditing}
          compact
        />
      );

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-sm px-2 py-2',
        selected
          ? 'bg-surface-hover'
          : hasError
            ? 'bg-warning/10'
            : 'hover:bg-surface-hover/40',
      )}
    >
      <div className="min-w-0 flex-1">{body}</div>
      <div className="shrink-0 self-center">{actions}</div>
    </div>
  );
}
