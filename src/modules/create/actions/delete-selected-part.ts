import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  clearSelection,
} from '@/modules/viewport/stores/selection-store';
import { deletePart } from '../domain/delete-part';
import { readCreatePart } from '../domain/part-data';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { asMesh, isInActiveModelScene } from '../utils/selected-part';

/**
 * Delete the selected stamped part on the focused created model.
 * Clears selection; leaves the library model entry in place.
 */
export function deleteSelectedPart(): void {
  const activeModel = $activeModel.get();
  const selected = $selection.get().object;

  if (!activeModel || activeModel.source !== 'created' || !selected) {
    return;
  }

  const mesh = asMesh(selected);
  if (!mesh || !isInActiveModelScene(mesh, activeModel.scene)) {
    return;
  }

  if (!readCreatePart(mesh)) {
    return;
  }

  clearSelection();
  deletePart(mesh);
  bumpCreatePartsRevision();
}
