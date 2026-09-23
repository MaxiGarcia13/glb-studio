import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { snapshotClipboardFromRoots } from '../domain/hierarchy/create-part-clipboard';
import { resolveSelectedCreateRoots } from '../domain/hierarchy/selected-create-roots';
import { setCreatePartClipboard } from '../stores/create-part-clipboard-store';

/**
 * Copy selected stamped create parts and/or create groups into the session
 * clipboard. Supports single selection and part multi-select. No-op when the
 * selection has no eligible hierarchy nodes on the focused created model.
 */
export function copySelectedCreatePart(): void {
  const context = resolveSelectedCreateRoots(
    $activeModel.get(),
    $selection.get(),
  );
  if (!context) {
    return;
  }

  const payload = snapshotClipboardFromRoots(context.roots);
  if (payload) {
    setCreatePartClipboard(payload);
  }
}
