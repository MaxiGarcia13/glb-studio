import type { Object3D } from 'three';
import { openSelectionContextMenu } from '../stores/selection-context-menu-store';

/**
 * Open the selection context menu without changing selection or focus.
 * Menu actions always read the current `$selection`.
 */
export function openContextMenuForModel(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault' | 'stopPropagation'>,
  _modelId: string,
): void {
  event.preventDefault();
  event.stopPropagation();
  openSelectionContextMenu(event.clientX, event.clientY);
}

/**
 * Open the selection context menu without changing selection or focus.
 * Menu actions always read the current `$selection`.
 */
export function openContextMenuForPart(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault' | 'stopPropagation'>,
  _mesh: Object3D,
  _modelId: string,
): void {
  event.preventDefault();
  event.stopPropagation();
  openSelectionContextMenu(event.clientX, event.clientY);
}

/** Open at pointer without changing selection (e.g. empty viewport miss). */
export function openContextMenuAtPointer(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault'>,
): void {
  event.preventDefault();
  openSelectionContextMenu(event.clientX, event.clientY);
}
