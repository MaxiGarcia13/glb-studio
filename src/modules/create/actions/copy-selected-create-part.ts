import { snapshotClipboardFromRoots } from '../domain/create-part-clipboard';
import { resolveSelectedCreateRoots } from '../domain/selected-create-roots';
import { setCreatePartClipboard } from '../stores/create-part-clipboard-store';

/**
 * Copy selected stamped create parts and/or create groups into the session
 * clipboard. Supports single selection and part multi-select. No-op when the
 * selection has no eligible hierarchy nodes on the focused created model.
 */
export function copySelectedCreatePart(): void {
  const context = resolveSelectedCreateRoots();
  if (!context) {
    return;
  }

  const payload = snapshotClipboardFromRoots(context.roots);
  if (payload) {
    setCreatePartClipboard(payload);
  }
}
