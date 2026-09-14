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
  className,
  headerClassName,
  headerContentClassName,
  contentClassName,
  actionsClassName,
}: Props) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={className}>
      <CollapsibleHeader
        className={cn(
          'rounded-sm',
          selected && 'bg-zinc-900 text-zinc-100',
          headerClassName,
        )}
      >
        {leading}
        <div className={cn('flex items-center gap-2 flex-1 min-w-0', headerContentClassName, contentClassName)}>
          {typeof title === 'string'
            ? (
                <Text as="h2" variant="section" className="flex-1 min-w-0 truncate">
                  {title}
                </Text>
              )
            : title}
          {actions && (
            <div
              className={cn('flex items-center gap-0.5 shrink-0', actionsClassName)}
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </div>
      </CollapsibleHeader>
      <CollapsibleContent className={cn('flex flex-col gap-2 w-full', contentClassName)}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
