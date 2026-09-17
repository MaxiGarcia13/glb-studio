import type { ActionMenuItem } from './types';
import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Text } from '@/components/text';
import { computeMenuPlacement } from './placement';

export interface PointerActionMenuProps {
  'open': boolean;
  /** Viewport (client) coordinates for the pointer. */
  'x': number;
  'y': number;
  'items': ActionMenuItem[];
  'onClose': () => void;
  'aria-label'?: string;
}

/**
 * ActionMenu-style panel anchored at a pointer position (context menu).
 * Dismisses on outside pointerdown / Escape.
 */
export function PointerActionMenu({
  open,
  x,
  y,
  items,
  onClose,
  'aria-label': ariaLabel = 'Actions',
}: PointerActionMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [placement, setPlacement] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const panelEl = panelRef.current;
      if (!panelEl) {
        return;
      }

      const trigger = {
        top: y,
        left: x,
        right: x,
        bottom: y,
        width: 0,
        height: 0,
        x,
        y,
        toJSON: () => ({}),
      } satisfies DOMRectReadOnly;

      const next = computeMenuPlacement({
        trigger,
        panelWidth: panelEl.offsetWidth,
        panelHeight: panelEl.offsetHeight,
        preferredSide: 'bottom',
        align: 'start',
        sideOffset: 0,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
      setPlacement({ top: next.top, left: next.left });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, x, y, items]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || items.length === 0) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      aria-label={ariaLabel}
      className="fixed z-50 min-w-40 rounded-sm border border-border-strong bg-surface py-2 shadow-lg"
      style={{
        top: placement?.top ?? y,
        left: placement?.left ?? x,
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
            onClose();
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
  );
}
