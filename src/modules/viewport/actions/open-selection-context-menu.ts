import type { Object3D } from 'three';
import { $model, selectModel } from '../stores/model-store';
import {
  isModelInSelection,
  isObjectInSelection,
  selectModelIds,
  selectObject,
} from '../stores/selection-store';
import { openSelectionContextMenu } from '../stores/selection-context-menu-store';

/** Ensure a model is the (sole) model selection, then open the context menu. */
export function openContextMenuForModel(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault' | 'stopPropagation'>,
  modelId: string,
): void {
  event.preventDefault();
  event.stopPropagation();

  if (!isModelInSelection(modelId)) {
    selectModel(modelId);
    if ($model.get().activeModelId === modelId) {
      selectModelIds([modelId]);
    }
  }

  openSelectionContextMenu(event.clientX, event.clientY);
}

/** Ensure a part is selected (replace if not in the set), then open the context menu. */
export function openContextMenuForPart(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault' | 'stopPropagation'>,
  mesh: Object3D,
  modelId: string,
): void {
  event.preventDefault();
  event.stopPropagation();

  if (!isObjectInSelection(mesh)) {
    if ($model.get().activeModelId !== modelId) {
      selectModel(modelId);
    }
    selectObject(mesh);
  }

  openSelectionContextMenu(event.clientX, event.clientY);
}

/** Open at pointer without changing selection (e.g. empty viewport miss). */
export function openContextMenuAtPointer(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'preventDefault'>,
): void {
  event.preventDefault();
  openSelectionContextMenu(event.clientX, event.clientY);
}
