import type { Object3D } from 'three';

import { $selection } from '@/modules/viewport/stores/selection-store';
import { isCreateHierarchyNode } from './group-data';

/** Find a node by uuid under `partsRoot` (includes the root itself). */
export function findUnderRoot(
  partsRoot: Object3D,
  uuid: string,
): Object3D | null {
  if (partsRoot.uuid === uuid) {
    return partsRoot;
  }
  return partsRoot.getObjectByProperty('uuid', uuid) ?? null;
}

/** Parent uuid for undo: `null` when under the model scene root. */
export function hierarchyParentUuid(
  node: Object3D,
  partsRoot: Object3D,
): string | null {
  if (!node.parent || node.parent === partsRoot) {
    return null;
  }
  return node.parent.uuid;
}

/** Resolve a stored parent uuid to a live node (`null` → parts root). */
export function resolveHierarchyParent(
  partsRoot: Object3D,
  parentUuid: string | null,
): Object3D {
  if (parentUuid === null) {
    return partsRoot;
  }
  return findUnderRoot(partsRoot, parentUuid) ?? partsRoot;
}

/**
 * Restore part selection from uuids under `partsRoot`.
 * Sets `$selection` directly — avoid `selectObject` pose flush mid-undo/redo.
 */
export function restoreCreateSelection(
  partsRoot: Object3D,
  selectUuids: readonly string[],
): void {
  const nodes = selectUuids
    .map((uuid) => findUnderRoot(partsRoot, uuid))
    .filter((node): node is Object3D =>
      node !== null && isCreateHierarchyNode(node));

  if (nodes.length === 0) {
    $selection.set({
      object: null,
      objects: [],
      modelIds: [],
      kind: 'none',
    });
    return;
  }

  $selection.set({
    object: nodes[nodes.length - 1]!,
    objects: nodes,
    modelIds: [],
    kind: 'parts',
  });
}
