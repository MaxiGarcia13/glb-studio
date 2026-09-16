import { cn } from '@maxigarcia/js-utils';

export const floatingToolbarClassName
  = 'pointer-events-auto flex items-center gap-2 rounded-sm bg-surface p-2';

interface FloatingToolbarProps {
  children: React.ReactNode;
  'aria-label': string;
  className?: string;
}

/** Shared shell for viewport floating chrome (toolbars, aside open chips, save rail). */
export function FloatingToolbar({
  children,
  'aria-label': ariaLabel,
  className,
}: FloatingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(floatingToolbarClassName, className)}
    >
      {children}
    </div>
  );
}
