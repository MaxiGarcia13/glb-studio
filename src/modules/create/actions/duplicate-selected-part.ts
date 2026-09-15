import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $selection,
  selectObject,
} from '@/modules/viewport/stores/selection-store';
import { duplicatePart } from '../domain/duplicate-part';
import { readCreatePart } from '../domain/part-data';
import { asMesh, isInActiveModelScene } from '../utils/selected-part';

/** Duplicate the selected stamped part on the focused created model and select the clone. */
export function duplicateSelectedPart(): void {
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

  const clone = duplicatePart(mesh, activeModel.scene);
  if (clone) {
    selectObject(clone);
  }
}
