import type { PartKindId } from '@/modules/create/types/part';
import { useStore } from '@nanostores/react';
import { useEffect, useId, useRef, useState } from 'react';
import { CubeIcon } from '@/components/icons/cube-icon';
import { Text } from '@/components/text';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { selectObject } from '@/modules/viewport/stores/selection-store';
import { addPart } from '../actions/add-part';
import { listPartKinds } from '../domain/part-kind';

const toolButtonClass
  = 'flex size-9 cursor-pointer items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white';

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
    const mesh = addPart(activeModel.id, kindId);
    if (mesh) {
      selectObject(mesh);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Add part"
        aria-label="Add part"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={toolButtonClass}
      >
        <CubeIcon aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Add part"
          className="absolute right-full top-0 z-50 mr-0.5 min-w-36 rounded-sm border border-zinc-600 bg-zinc-800 py-1 shadow-lg"
        >
          {kinds.map((kind) => (
            <button
              key={kind.id}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center px-2.5 py-1.5 text-left text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
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
