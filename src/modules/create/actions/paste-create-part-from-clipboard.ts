import type { Object3D } from 'three';
import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';
import {
  $selection,
  selectObject,
} from '@/modules/viewport/stores/selection-store';
import { instantiateClipboardPayload } from '../domain/create-part-clipboard';
import { selectedCreateHierarchyUuids } from '../domain/selected-create-roots';
import { $createPartClipboard } from '../stores/create-part-clipboard-store';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { pushCreateSceneInsertUndo } from './push-create-scene-undo';

function selectPastedRoots(roots: Object3D[]): void {
  if (roots.length === 0) {
    return;
  }
  if (roots.length === 1) {
    selectObject(roots[0]!);
    return;
  }
  if ($poseDirty.get()) {
    commitPendingPose();
  }
  $selection.set({
    object: roots[roots.length - 1]!,
    objects: roots,
    modelIds: [],
    kind: 'parts',
  });
}

/**
 * Paste the session create-part clipboard into the focused created model.
 * No-op when the buffer is empty or focus is not a created model.
 * Pushes one createScene undo entry.
 */
export function pasteCreatePartFromClipboard(): void {
  const payload = $createPartClipboard.get();
  const activeModel = $activeModel.get();

  if (!payload || !activeModel || activeModel.source !== 'created') {
    return;
  }

  const beforeSelectUuids = selectedCreateHierarchyUuids(
    $selection.get().objects,
  );

  const roots = instantiateClipboardPayload(payload, activeModel.scene);
  selectPastedRoots(roots);
  bumpCreatePartsRevision();

  pushCreateSceneInsertUndo({
    modelId: activeModel.id,
    partsRoot: activeModel.scene,
    insertedRoots: roots,
    beforeSelectUuids,
  });
}
