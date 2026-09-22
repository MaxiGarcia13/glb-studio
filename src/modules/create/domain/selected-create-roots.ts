import type { Object3D } from 'three';

import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { isInActiveModelScene } from '../utils/selected-part';
import { resolveClipboardRoots } from './create-part-clipboard';
import { isCreateHierarchyNode } from './group-data';

/** UUIDs of create hierarchy nodes in the current part selection. */
export function selectedCreateHierarchyUuids(): string[] {
  return $selection.get().objects.filter((object) => isCreateHierarchyNode(object)).map((object) => object.uuid);
}

export interface SelectedCreateRoots {
  modelId: string;
  partsRoot: Object3D;
  /** Clipboard roots (skips nodes nested under another selected node). */
  roots: Object3D[];
  /** All eligible selected hierarchy nodes (before root collapse). */
  selectUuids: string[];
}

/**
 * Eligible create-part / create-group clipboard roots on the focused created
 * model. Shared by Copy and Delete.
 */
export function resolveSelectedCreateRoots(): SelectedCreateRoots | null {
  const activeModel = $activeModel.get();
  const selection = $selection.get();

  if (
    !activeModel
    || activeModel.source !== 'created'
    || selection.kind !== 'parts'
    || selection.objects.length === 0
  ) {
    return null;
  }

  const eligible = selection.objects.filter(
    (object) =>
      isCreateHierarchyNode(object)
      && isInActiveModelScene(object, activeModel.scene),
  );
  if (eligible.length === 0) {
    return null;
  }

  const roots = resolveClipboardRoots(eligible);
  if (roots.length === 0) {
    return null;
  }

  return {
    modelId: activeModel.id,
    partsRoot: activeModel.scene,
    roots,
    selectUuids: eligible.map((object) => object.uuid),
  };
}
