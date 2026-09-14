import { cn } from '@maxigarcia/js-utils';
import { ChevronRight } from '@/components/icons/chevron-right-icon';
import { Text } from '@/components/text';
import { useCollapsible } from './collapsible-context';

interface CollapsibleProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  /**
   * When false, hide the chevron but keep the gutter so labels stay aligned.
   * Defaults to true.
   */
  showChevron?: boolean;
  /**
   * When false, the header does not toggle open/closed.
   * Defaults to true.
   */
  collapsible?: boolean;
}

export function CollapsibleHeader({
  title,
  children,
  className,
  showChevron = true,
  collapsible = true,
}: CollapsibleProps) {
  const { open, panelId, setOpen } = useCollapsible();
  const canToggle = collapsible && showChevron;

  return (
    <header
      role={canToggle ? 'button' : undefined}
      aria-expanded={canToggle ? open : undefined}
      aria-controls={canToggle ? panelId : undefined}
      tabIndex={canToggle ? 0 : undefined}
      onClick={canToggle ? () => setOpen(!open) : undefined}
      onKeyDown={canToggle
        ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen(!open);
            }
          }
        : undefined}
      className={cn(
        'flex items-start gap-1 min-h-7 w-full text-left text-zinc-400 transition-colors',
        canToggle && 'cursor-pointer hover:text-zinc-100',
        className,
      )}
    >
      {showChevron && (
        <span className="inline-flex h-7 w-4 shrink-0 items-center justify-center">
          <ChevronRight
            className={cn('transition-transform', open && 'rotate-90')}
            aria-hidden
          />
        </span>
      )}

      <div className="flex min-h-7 flex-1 items-center gap-2 min-w-0">
        {title && (
          <Text as="h2" variant="section">
            {title}
          </Text>
        )}

        {children}
      </div>
    </header>
  );
}
