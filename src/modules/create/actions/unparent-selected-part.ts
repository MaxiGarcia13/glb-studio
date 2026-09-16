import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { unparentPart } from '../domain/parent-part';
import { readCreatePart } from '../domain/part-data';
import { asMesh, isInActiveModelScene } from '../utils/selected-part';

/**
 * Move the selected stamped part under the focused created model's parts root.
 * Preserves world transform; no-ops when already at root or selection is invalid.
 */
export function unparentSelectedPart(): boolean {
  const activeModel = $activeModel.get();
  const selected = $selection.get().object;

  if (!activeModel || activeModel.source !== 'created' || !selected) {
    return false;
  }

  const mesh = asMesh(selected);
  if (!mesh || !isInActiveModelScene(mesh, activeModel.scene)) {
    return false;
  }

  if (!readCreatePart(mesh)) {
    return false;
  }

  return unparentPart(mesh, activeModel.scene);
}
