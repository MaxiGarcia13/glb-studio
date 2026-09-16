import { cn } from '@maxigarcia/js-utils';
import { Collapsible, CollapsibleContent, CollapsibleHeader } from '@/components/collapsible';
import { Text } from '@/components/text';

interface Props {
  title: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  selected?: boolean;
  /** Show expand chevron when the section has nested content. Defaults to true. */
  showChevron?: boolean;
  /** Draw a vertical tree guide beside nested children when open. Defaults to showChevron. */
  showTreeGuide?: boolean;
  className?: string;
  headerClassName?: string;
  headerContentClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
}

export function LibrarySectionCollapsible({
  title,
  leading,
  actions,
  children,
  defaultOpen,
  selected = false,
  showChevron = true,
  showTreeGuide = showChevron,
  className,
  headerClassName,
  headerContentClassName,
  contentClassName,
  actionsClassName,
}: Props) {
  const canCollapse = showChevron;

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn('gap-2', className)}>
      <CollapsibleHeader
        showChevron={showChevron}
        collapsible={canCollapse}
        className={cn(
          'rounded-sm px-2 hover:bg-surface-hover/40 hover:text-fg',
          selected && 'bg-accent/15 text-fg',
          headerClassName,
        )}
      >
        {leading}
        <div className={cn('flex items-center gap-2 flex-1 min-w-0', headerContentClassName)}>
          {typeof title === 'string'
            ? (
                <Text as="h2" variant="section" className="flex-1 min-w-0 truncate">
                  {title}
                </Text>
              )
            : title}
          {actions && (
            <div
              className={cn('flex items-center gap-2 shrink-0', actionsClassName)}
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </div>
      </CollapsibleHeader>
      <CollapsibleContent
        className={cn(
          'relative w-full gap-2',
          showTreeGuide && 'pl-4',
          contentClassName,
        )}
      >
        {showTreeGuide && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-2 w-px bg-border"
          />
        )}
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
