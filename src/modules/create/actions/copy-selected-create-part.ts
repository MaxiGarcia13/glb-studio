import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  resolveClipboardRoots,
  snapshotClipboardFromRoots,
} from '../domain/create-part-clipboard';
import { isCreateHierarchyNode } from '../domain/group-data';
import { setCreatePartClipboard } from '../stores/create-part-clipboard-store';
import { isInActiveModelScene } from '../utils/selected-part';

/**
 * Copy selected stamped create parts and/or create groups into the session
 * clipboard. Supports single selection and part multi-select. No-op when the
 * selection has no eligible hierarchy nodes on the focused created model.
 */
export function copySelectedCreatePart(): void {
  const activeModel = $activeModel.get();
  const selection = $selection.get();

  if (
    !activeModel
    || activeModel.source !== 'created'
    || selection.kind !== 'parts'
    || selection.objects.length === 0
  ) {
    return;
  }

  const eligible = selection.objects.filter(
    (object) =>
      isCreateHierarchyNode(object)
      && isInActiveModelScene(object, activeModel.scene),
  );
  if (eligible.length === 0) {
    return;
  }

  const roots = resolveClipboardRoots(eligible);
  const payload = snapshotClipboardFromRoots(roots);
  if (payload) {
    setCreatePartClipboard(payload);
  }
}
