import type { MenuAlign, MenuSide } from './placement';
import type { ActionMenuItem } from './types';
import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/button';
import { DotsVerticalIcon } from '@/components/icons/dots-vertical-icon';
import { Text } from '@/components/text';
import { useMenuPlacement } from './use-menu-placement';

interface ActionMenuProps {
  'items': ActionMenuItem[];
  /** Visible trigger text (menu-bar style). Defaults to icon. */
  'label'?: string;
  /** Custom trigger icon when `label` is omitted. Defaults to ⋮. */
  'icon'?: React.ReactNode;
  'aria-label'?: string;
  /** Preferred open direction. Flips if it would leave the viewport. */
  'side'?: MenuSide;
  /** Cross-axis alignment relative to the trigger. */
  'align'?: MenuAlign;
  'open'?: boolean;
  'onOpenChange'?: (open: boolean) => void;
  'className'?: string;
}

export function ActionMenu({
  items,
  label,
  icon,
  'aria-label': ariaLabel,
  side = 'bottom',
  align = 'end',
  open: openControlled,
  onOpenChange,
  className,
}: ActionMenuProps) {
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
  const resolvedAriaLabel = ariaLabel ?? label ?? 'More actions';
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

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        ref={triggerRef}
        variant="ghost"
        aria-label={resolvedAriaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={resolvedAriaLabel}
        className={label ? 'px-2 py-1' : 'p-2'}
        onClick={() => setOpen(!open)}
      >
        {label
          ? (
              <Text as="span" className="text-current">
                {label}
              </Text>
            )
          : (icon ?? <DotsVerticalIcon />)}
      </Button>

      {open
        && createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={resolvedAriaLabel}
            className="fixed z-50 min-w-40 rounded-sm border border-border-strong bg-surface py-2 shadow-lg"
            style={{
              top: placement?.top ?? 0,
              left: placement?.left ?? 0,
              visibility: placement ? 'visible' : 'hidden',
            }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.title ?? item.label}
                className={cn(
                  'flex w-full items-center gap-2 px-2 py-2 text-left text-xs transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:bg-surface-hover',
                  item.danger ? 'text-danger' : 'text-fg',
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (item.disabled) {
                    return;
                  }
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.icon && (
                  <span className="inline-flex shrink-0 text-current [&_svg]:size-4">
                    {item.icon}
                  </span>
                )}
                <Text as="span" className="min-w-0 flex-1 truncate text-current">
                  {item.label}
                </Text>
                {item.shortcut && (
                  <Text as="span" variant="muted" className="shrink-0">
                    {item.shortcut}
                  </Text>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
