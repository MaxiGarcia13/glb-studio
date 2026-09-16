import type { PartKindId } from '@/modules/create/types/part';
import { useStore } from '@nanostores/react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { CubeIcon } from '@/components/icons/cube-icon';
import { Text } from '@/components/text';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { addPart } from '../actions/add-part';
import { listPartKinds } from '../domain/part-kind';

/**
 * Add-part menu for the create rail: one entry per registered kind.
 * Caller mounts only when a created model is focused.
 */
export function AddPartPalette() {
  const activeModel = useStore($activeModel);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const kinds = listPartKinds();

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

  if (!activeModel || activeModel.source !== 'created') {
    return null;
  }

  const handleAdd = (kindId: PartKindId) => {
    setOpen(false);
    addPart(activeModel.id, kindId);
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        title="Add part"
        aria-label="Add part"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <CubeIcon aria-hidden />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Add part"
          className="absolute right-full top-0 z-50 mr-2 min-w-36 rounded-sm border border-border-strong bg-surface py-2 shadow-lg"
        >
          {kinds.map((kind) => (
            <button
              key={kind.id}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center px-2 py-2 text-left text-xs text-fg transition-colors hover:bg-surface-hover"
              onClick={() => handleAdd(kind.id)}
            >
              <Text as="span" className="text-current">
                {kind.label}
              </Text>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
