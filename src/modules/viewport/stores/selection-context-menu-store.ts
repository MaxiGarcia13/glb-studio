import { map } from 'nanostores';

export interface SelectionContextMenuState {
  open: boolean;
  x: number;
  y: number;
}

export const $selectionContextMenu = map<SelectionContextMenuState>({
  open: false,
  x: 0,
  y: 0,
});

export function openSelectionContextMenu(x: number, y: number): void {
  $selectionContextMenu.set({ open: true, x, y });
}

export function closeSelectionContextMenu(): void {
  if (!$selectionContextMenu.get().open) {
    return;
  }
  $selectionContextMenu.setKey('open', false);
}
