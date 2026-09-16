export type MenuSide = 'top' | 'bottom' | 'left' | 'right';
export type MenuAlign = 'start' | 'end';

const OPPOSITE: Record<MenuSide, MenuSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

export interface MenuPlacementInput {
  trigger: DOMRectReadOnly;
  panelWidth: number;
  panelHeight: number;
  preferredSide: MenuSide;
  align: MenuAlign;
  /** Gap between trigger and panel (px). */
  sideOffset?: number;
  /** Minimum inset from viewport edges (px). */
  padding?: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface MenuPlacement {
  side: MenuSide;
  top: number;
  left: number;
}

function anchorMainAxis(
  side: MenuSide,
  trigger: DOMRectReadOnly,
  panelWidth: number,
  panelHeight: number,
  sideOffset: number,
): { top: number; left: number } {
  switch (side) {
    case 'bottom':
      return { top: trigger.bottom + sideOffset, left: 0 };
    case 'top':
      return { top: trigger.top - panelHeight - sideOffset, left: 0 };
    case 'left':
      return { top: 0, left: trigger.left - panelWidth - sideOffset };
    case 'right':
      return { top: 0, left: trigger.right + sideOffset };
  }
}

function applyAlign(
  side: MenuSide,
  align: MenuAlign,
  trigger: DOMRectReadOnly,
  panelWidth: number,
  panelHeight: number,
  base: { top: number; left: number },
): { top: number; left: number } {
  if (side === 'top' || side === 'bottom') {
    const left = align === 'start'
      ? trigger.left
      : trigger.right - panelWidth;
    return { top: base.top, left };
  }

  const top = align === 'start'
    ? trigger.top
    : trigger.bottom - panelHeight;
  return { top, left: base.left };
}

function overflowsMainAxis(
  side: MenuSide,
  top: number,
  left: number,
  panelWidth: number,
  panelHeight: number,
  padding: number,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  switch (side) {
    case 'bottom':
      return top + panelHeight > viewportHeight - padding;
    case 'top':
      return top < padding;
    case 'right':
      return left + panelWidth > viewportWidth - padding;
    case 'left':
      return left < padding;
  }
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Preferred side → flip if it overflows → shift on both axes to stay in viewport.
 */
export function computeMenuPlacement(input: MenuPlacementInput): MenuPlacement {
  const {
    trigger,
    panelWidth,
    panelHeight,
    preferredSide,
    align,
    sideOffset = 4,
    padding = 8,
    viewportWidth,
    viewportHeight,
  } = input;

  const place = (side: MenuSide) => {
    const base = anchorMainAxis(side, trigger, panelWidth, panelHeight, sideOffset);
    return applyAlign(side, align, trigger, panelWidth, panelHeight, base);
  };

  let side = preferredSide;
  let { top, left } = place(side);

  if (
    overflowsMainAxis(
      side,
      top,
      left,
      panelWidth,
      panelHeight,
      padding,
      viewportWidth,
      viewportHeight,
    )
  ) {
    const flipped = OPPOSITE[side];
    const next = place(flipped);
    if (
      !overflowsMainAxis(
        flipped,
        next.top,
        next.left,
        panelWidth,
        panelHeight,
        padding,
        viewportWidth,
        viewportHeight,
      )
    ) {
      side = flipped;
      top = next.top;
      left = next.left;
    }
  }

  left = clamp(left, padding, viewportWidth - padding - panelWidth);
  top = clamp(top, padding, viewportHeight - padding - panelHeight);

  return { side, top, left };
}
