import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { Text } from '@/components/text';

interface ActionMenuPanelProps {
  'label': string;
  'children': React.ReactNode;
  'aria-label'?: string;
  'align'?: 'start' | 'end';
  'open'?: boolean;
  'onOpenChange'?: (open: boolean) => void;
  'className'?: string;
  'panelClassName'?: string;
}

/** Text-trigger dropdown that hosts arbitrary panel content (e.g. Settings). */
export function ActionMenuPanel({
  label,
  children,
  'aria-label': ariaLabel,
  align = 'start',
  open: openControlled,
  onOpenChange,
  className,
  panelClassName,
}: ActionMenuPanelProps) {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openControlled ?? openUncontrolled;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openControlled === undefined) {
      setOpenUncontrolled(next);
    }
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const resolvedAriaLabel = ariaLabel ?? label;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        aria-label={resolvedAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={resolvedAriaLabel}
        className="px-2 py-1"
        onClick={() => setOpen(!open)}
      >
        <Text as="span" className="text-current">
          {label}
        </Text>
      </Button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label={resolvedAriaLabel}
          className={cn(
            'absolute top-full z-50 mt-1 min-w-56 rounded-sm border border-border-strong bg-surface p-4 shadow-lg',
            align === 'start' ? 'left-0' : 'right-0',
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
