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
  variant = 'row',
}: AssetEntryProps) {
  const hasError = status === 'error';
  const isRow = variant === 'row';
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
          description={isRow && !hasError ? null : description}
          errorDetail={errorDetail}
          status={status}
          statusLabel={statusLabel}
          canRename={canRename}
          onSelect={onSelect}
          onStartRename={startEditing}
          compact={isRow}
          selected={selected}
        />
      );

  return (
    <div
      className={cn(
        isRow
          ? cn(
              'flex items-start gap-1 rounded-sm px-1.5 py-0.5',
              selected
                ? 'bg-sky-500/15'
                : hasError
                  ? 'bg-amber-500/10'
                  : 'hover:bg-zinc-700/40',
            )
          : cn(
              'flex flex-col gap-2 rounded-sm p-2 ring-1',
              selected
                ? 'bg-sky-500/15 ring-sky-500/30'
                : hasError
                  ? 'bg-zinc-800/40 ring-amber-500/25'
                  : 'bg-zinc-800/40 ring-zinc-700/80',
            ),
      )}
    >
      {isRow
        ? (
            <>
              <div className="min-w-0 flex-1">{body}</div>
              <div className="shrink-0 self-center">{actions}</div>
            </>
          )
        : (
            <>
              {body}
              {actions}
            </>
          )}
    </div>
  );
}
