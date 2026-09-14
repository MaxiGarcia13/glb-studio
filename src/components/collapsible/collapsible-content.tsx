import { cn } from '@maxigarcia/js-utils';
import { useCollapsible } from './collapsible-context';

interface CollapsibleProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleContent({
  children,
  className,
}: CollapsibleProps) {
  const { panelId, open } = useCollapsible();

  if (!open)
    return null;

  return (
    <div id={panelId} className={cn('flex flex-col', className)}>
      {children}
    </div>
  );
}
