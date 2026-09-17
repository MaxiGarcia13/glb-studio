import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { snapshotCreatePart } from '../domain/create-part-clipboard';
import { readCreatePart } from '../domain/part-data';
import { setCreatePartClipboard } from '../stores/create-part-clipboard-store';
import { asMesh, isInActiveModelScene } from '../utils/selected-part';

/**
 * Copy the selected stamped create part into the session clipboard.
 * No-op when selection is not an eligible create part.
 */
export function copySelectedCreatePart(): void {
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

  const snapshot = snapshotCreatePart(mesh);
  if (snapshot) {
    setCreatePartClipboard(snapshot);
  }
}
