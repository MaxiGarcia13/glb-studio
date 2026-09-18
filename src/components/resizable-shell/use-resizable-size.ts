import type { StorageKey } from '@/utils/local-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoredNumber, setStoredNumber } from '@/utils/local-storage';

export type ResizableAxis = 'horizontal' | 'vertical';
export type ResizableEdge = 'start' | 'end';

export interface UseResizableSizeOptions {
  axis: ResizableAxis;
  edge: ResizableEdge;
  storageKey: StorageKey;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  /** When false, size stays at defaultSize and drag is a no-op. */
  enabled?: boolean;
  /** Optional live max (e.g. viewport fraction) applied while dragging. */
  getMaxSize?: () => number;
}

export interface UseResizableSizeResult {
  size: number;
  onHandlePointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useResizableSize({
  axis,
  edge,
  storageKey,
  defaultSize,
  minSize,
  maxSize,
  enabled = true,
  getMaxSize,
}: UseResizableSizeOptions): UseResizableSizeResult {
  const [size, setSize] = useState(() => {
    if (!enabled) {
      return defaultSize;
    }
    return getStoredNumber(storageKey, defaultSize, { min: minSize, max: maxSize });
  });

  const sizeRef = useRef(size);
  sizeRef.current = size;

  const optsRef = useRef({ axis, edge, minSize, maxSize, enabled, getMaxSize, storageKey });
  optsRef.current = { axis, edge, minSize, maxSize, enabled, getMaxSize, storageKey };

  useEffect(() => {
    if (!enabled) {
      setSize(defaultSize);
      return;
    }
    setSize(getStoredNumber(storageKey, defaultSize, { min: minSize, max: maxSize }));
  }, [enabled, storageKey, defaultSize, minSize, maxSize]);

  const onHandlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const opts = optsRef.current;
    if (!opts.enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);

    const startPos = opts.axis === 'horizontal' ? event.clientX : event.clientY;
    const startSize = sizeRef.current;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: PointerEvent) => {
      const pos = opts.axis === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
      let delta = pos - startPos;
      if (opts.edge === 'start') {
        delta = -delta;
      }

      const liveMax = opts.getMaxSize?.() ?? opts.maxSize;
      const next = clamp(startSize + delta, opts.minSize, Math.min(opts.maxSize, liveMax));
      sizeRef.current = next;
      setSize(next);
    };

    const onUp = () => {
      handle.releasePointerCapture(pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = previousUserSelect;
      setStoredNumber(opts.storageKey, sizeRef.current);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }, []);

  return { size, onHandlePointerDown };
}
