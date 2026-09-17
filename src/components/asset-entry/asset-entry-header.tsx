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
        compact ? 'gap-2 min-h-8 justify-center' : 'gap-2',
        onSelect ? 'cursor-pointer' : 'cursor-default',
        canRename ? 'group' : '',
      )}
    >
      <div className="flex items-center gap-2 min-h-8">
        {leading && (
          <span className="shrink-0 text-fg-muted">
            {leading}
          </span>
        )}
        <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
          <Text
            className={cn(
              'min-w-0 truncate',
              labelClass({ hasError }),
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
                'shrink-0 rounded-sm px-2 py-0.5 leading-none',
                status
                  ? statusBadgeClass[status]
                  : 'bg-control/80 text-fg-muted',
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
            'pl-6',
          )}
          title={errorDetail ?? description}
        >
          {description}
        </Text>
      )}
    </button>
  );
}

function labelClass({ hasError }: { hasError: boolean }): string {
  if (hasError) {
    return 'text-warning';
  }
  return 'text-fg';
}
