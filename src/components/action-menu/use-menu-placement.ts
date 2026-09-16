import type { MenuAlign, MenuPlacement, MenuSide } from './placement';
import { useLayoutEffect, useState } from 'react';
import { computeMenuPlacement } from './placement';

interface UseMenuPlacementArgs {
  open: boolean;
  side: MenuSide;
  align: MenuAlign;
  triggerRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
}

/**
 * Fixed-viewport coords for an open menu panel (flip preferred side, then shift).
 */
export function useMenuPlacement({
  open,
  side,
  align,
  triggerRef,
  panelRef,
}: UseMenuPlacementArgs): MenuPlacement | null {
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const triggerEl = triggerRef.current;
      const panelEl = panelRef.current;
      if (!triggerEl || !panelEl) {
        return;
      }

      const trigger = triggerEl.getBoundingClientRect();
      setPlacement(
        computeMenuPlacement({
          trigger,
          panelWidth: panelEl.offsetWidth,
          panelHeight: panelEl.offsetHeight,
          preferredSide: side,
          align,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        }),
      );
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, side, align, triggerRef, panelRef]);

  return placement;
}
