import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { readCreatePart } from '../domain/part-data';
import { unparentPart } from '../domain/parent-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
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

  const ok = unparentPart(mesh, activeModel.scene);
  if (ok) {
    bumpCreatePartsRevision();
  }
  return ok;
}
