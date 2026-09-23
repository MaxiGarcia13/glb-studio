import type { Object3D } from 'three';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { SelectionState } from '@/modules/viewport/types/selection';

import { isInActiveModelScene } from '@/modules/create/utils/selected-part';
import { resolveClipboardRoots } from './create-part-clipboard';
import { isCreateHierarchyNode } from './group-data';

/** UUIDs of create hierarchy nodes among `objects`. */
export function selectedCreateHierarchyUuids(
  objects: readonly Object3D[],
): string[] {
  return objects
    .filter((object) => isCreateHierarchyNode(object))
    .map((object) => object.uuid);
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
 * Eligible create-part / create-group clipboard roots on a focused created
 * model. Shared by Copy and Delete. Store-free — actions pass snapshots.
 */
export function resolveSelectedCreateRoots(
  activeModel: ModelEntry | null | undefined,
  selection: SelectionState,
): SelectedCreateRoots | null {
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
