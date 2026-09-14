import { cn } from '@maxigarcia/js-utils';
import { CollapsibleProvider } from './collapsible-provider';

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({
  children,
  defaultOpen = false,
  className,
}: CollapsibleProps) {
  return (
    <CollapsibleProvider defaultOpen={defaultOpen}>
      <div className={cn('flex flex-col', className)}>
        {children}
      </div>
    </CollapsibleProvider>
  );
}
