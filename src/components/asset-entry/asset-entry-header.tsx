import type { AssetStatus } from './types';
import { cn } from '@maxigarcia/js-utils';
import { Text } from '@/components/text';
import { defaultStatusLabel, statusBadgeClass } from './constants';

interface AssetEntryHeaderProps {
  label: string;
  title?: string;
  leading?: React.ReactNode;
  description?: string | null;
  errorDetail?: string | null;
  status?: AssetStatus;
  statusLabel?: string;
  canRename: boolean;
  onSelect?: () => void;
  onStartRename?: () => void;
  /** Tighter typography for outliner rows. */
  compact?: boolean;
  selected?: boolean;
}

export function AssetEntryHeader({
  label,
  title,
  leading,
  description,
  errorDetail,
  status,
  statusLabel,
  canRename,
  onSelect,
  onStartRename,
  compact = false,
  selected = false,
}: AssetEntryHeaderProps) {
  const hasError = status === 'error';
  const badgeText = statusLabel ?? (status ? defaultStatusLabel[status] : null);

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={canRename ? onStartRename : undefined}
      disabled={!onSelect}
      className={cn(
        'flex w-full flex-col text-left',
        compact ? 'gap-0.5 min-h-7 justify-center' : 'gap-1',
        onSelect ? 'cursor-pointer' : 'cursor-default',
        canRename ? 'group' : '',
      )}
    >
      <div className="flex items-center gap-1.5 min-h-7">
        {leading && (
          <span className="shrink-0 text-zinc-400">
            {leading}
          </span>
        )}
        <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
          <Text
            className={cn(
              'min-w-0 truncate',
              labelClass({ compact, hasError, selected }),
              canRename && 'group-hover:underline',
            )}
            title={title ?? label}
          >
            {label}
          </Text>
          {badgeText && (
            <Text
              as="span"
              className={cn(
                'shrink-0 rounded-sm px-1.5 py-0.5 leading-none',
                status
                  ? statusBadgeClass[status]
                  : 'bg-zinc-700/80 text-zinc-300',
              )}
            >
              {badgeText}
            </Text>
          )}
        </div>
      </div>
      {description && (
        <Text
          variant={hasError ? 'error' : 'muted'}
          className={cn(
            'leading-snug line-clamp-2',
            compact ? 'pl-5' : 'pl-5.5',
          )}
          title={errorDetail ?? description}
        >
          {description}
        </Text>
      )}
    </button>
  );
}

function labelClass({
  compact,
  hasError,
  selected,
}: {
  compact: boolean;
  hasError: boolean;
  selected: boolean;
}): string {
  if (hasError) {
    return 'text-amber-200';
  }
  if (selected) {
    return 'text-sky-300';
  }
  return compact ? 'text-zinc-200' : 'text-zinc-100';
}
