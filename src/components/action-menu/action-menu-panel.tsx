import type { MenuAlign, MenuSide } from './placement';
import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useMenuPlacement } from './use-menu-placement';

interface ActionMenuPanelProps {
  'label': string;
  'children': React.ReactNode;
  'aria-label'?: string;
  /** Preferred open direction. Flips if it would leave the viewport. */
  'side'?: MenuSide;
  /** Cross-axis alignment relative to the trigger. */
  'align'?: MenuAlign;
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
  side = 'bottom',
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const resolvedAriaLabel = ariaLabel ?? label;
  const placement = useMenuPlacement({
    open,
    side,
    align,
    triggerRef,
    panelRef,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target)
        || panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
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
        ref={triggerRef}
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

      {open
        && createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-label={resolvedAriaLabel}
            className={cn(
              'fixed z-50 min-w-56 rounded-sm border border-border-strong bg-surface p-4 shadow-lg',
              panelClassName,
            )}
            style={{
              top: placement?.top ?? 0,
              left: placement?.left ?? 0,
              visibility: placement ? 'visible' : 'hidden',
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
