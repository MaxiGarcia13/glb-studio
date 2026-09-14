import type { ActionMenuItem } from './types';
import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { DotsVerticalIcon } from '@/components/icons/dots-vertical-icon';
import { Text } from '@/components/text';

interface ActionMenuProps {
  items: ActionMenuItem[];
  'aria-label'?: string;
  className?: string;
}

export function ActionMenu({
  items,
  'aria-label': ariaLabel = 'More actions',
  className,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={ariaLabel}
        className="p-1.5"
        onClick={() => setOpen((current) => !current)}
      >
        <DotsVerticalIcon />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          className="absolute right-0 top-full z-50 mt-0.5 min-w-40 rounded-sm border border-zinc-600 bg-zinc-800 py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors',
                item.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-zinc-700',
                item.danger ? 'text-red-400' : 'text-zinc-200',
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
                <span className="inline-flex shrink-0 text-current [&_svg]:size-3.5">
                  {item.icon}
                </span>
              )}
              <Text as="span" className="min-w-0 truncate text-current">
                {item.label}
              </Text>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
