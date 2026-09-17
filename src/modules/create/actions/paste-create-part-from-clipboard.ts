import { $activeModel } from '@/modules/viewport/stores/model-store';
import { selectObject } from '@/modules/viewport/stores/selection-store';
import { instantiateCreatePartSnapshot } from '../domain/create-part-clipboard';
import { $createPartClipboard } from '../stores/create-part-clipboard-store';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';

/**
 * Paste the session create-part clipboard into the focused created model.
 * No-op when the buffer is empty or focus is not a created model.
 */
export function pasteCreatePartFromClipboard(): void {
  const entry = $createPartClipboard.get();
  const activeModel = $activeModel.get();

  if (!entry || !activeModel || activeModel.source !== 'created') {
    return;
  }

  const mesh = instantiateCreatePartSnapshot(entry, activeModel.scene);
  selectObject(mesh);
  bumpCreatePartsRevision();
}
