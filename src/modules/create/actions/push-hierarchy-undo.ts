import type { Object3D } from 'three';

import type { CreateHierarchySnapshot } from '@/modules/animation/types/undo-stack';
import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';

import {
  captureCreateHierarchySnapshot,
  listCreateGroups,
  snapshotHierarchyGroupSpec,
  snapshotHierarchyPlacement,
} from '../domain/create-hierarchy-undo';
import { isCreateHierarchyNode } from '../domain/group-data';

/**
 * Push a createHierarchy undo entry from full before/after graph captures.
 * Used by Make connector (multi-node tree edits).
 */
export function pushHierarchyGraphUndo(options: {
  modelId: string;
  partsRoot: Object3D;
  beforeSelectUuids: readonly string[];
  afterSelectUuids?: readonly string[];
  /**
   * Perform the hierarchy mutation. May return select UUIDs for the after
   * snapshot when they are only known after the mutate.
   */
  mutate: () => boolean | { ok: boolean; selectUuids?: readonly string[] };
}): boolean {
  const { modelId, partsRoot } = options;
  const beforeGroups = listCreateGroups(partsRoot);
  const beforeGroupUuids = new Set(beforeGroups.map((group) => group.uuid));
  const before = captureCreateHierarchySnapshot(modelId, partsRoot, {
    selectUuids: options.beforeSelectUuids,
  });

  const mutateResult = options.mutate();
  const ok = typeof mutateResult === 'boolean' ? mutateResult : mutateResult.ok;
  if (!ok) {
    return false;
  }

  const afterSelect
    = typeof mutateResult === 'boolean'
      ? (options.afterSelectUuids ?? [])
      : (mutateResult.selectUuids ?? options.afterSelectUuids ?? []);

  const afterGroups = listCreateGroups(partsRoot);
  const afterGroupUuids = new Set(afterGroups.map((group) => group.uuid));
  const createdUuids = afterGroups
    .filter((group) => !beforeGroupUuids.has(group.uuid))
    .map((group) => group.uuid);
  const removedUuids = beforeGroups
    .filter((group) => !afterGroupUuids.has(group.uuid))
    .map((group) => group.uuid);

  const after = captureCreateHierarchySnapshot(modelId, partsRoot, {
    selectUuids: afterSelect,
  });

  pushUndoableCommand({
    id: 'createHierarchy',
    modelId,
    before: {
      ...before,
      removeGroupUuids: createdUuids,
    },
    after: {
      ...after,
      removeGroupUuids: removedUuids,
    },
  });
  return true;
}

/**
 * Capture before/after for dissolving create groups/joints, then push undo.
 * `mutate` performs the dissolve; returns false if nothing changed.
 */
export function pushDissolveGroupsUndo(options: {
  modelId: string;
  partsRoot: Object3D;
  groups: readonly Object3D[];
  beforeSelectUuids: readonly string[];
  afterSelectUuids: readonly string[];
  mutate: () => boolean;
}): boolean {
  const { modelId, partsRoot, groups } = options;
  const ensureGroups = groups
    .map((group) => snapshotHierarchyGroupSpec(group))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const children = groups.flatMap((group) =>
    [...group.children].filter((child) => isCreateHierarchyNode(child)),
  );
  const beforePlacements = [
    ...groups.map((group) => snapshotHierarchyPlacement(group, partsRoot)),
    ...children.map((child) => snapshotHierarchyPlacement(child, partsRoot)),
  ];

  if (!options.mutate()) {
    return false;
  }

  const afterPlacements = children
    .filter((child) => child.parent !== null)
    .map((child) => snapshotHierarchyPlacement(child, partsRoot));

  const before: CreateHierarchySnapshot = {
    modelId,
    ensureGroups,
    removeGroupUuids: [],
    placements: beforePlacements,
    selectUuids: options.beforeSelectUuids,
  };
  const after: CreateHierarchySnapshot = {
    modelId,
    ensureGroups: [],
    removeGroupUuids: groups.map((group) => group.uuid),
    placements: afterPlacements,
    selectUuids: options.afterSelectUuids,
  };

  pushUndoableCommand({
    id: 'createHierarchy',
    modelId,
    before,
    after,
  });
  return true;
}

/**
 * Capture before/after for lifting nodes to parts root (ungroup lift path).
 */
export function pushReparentUndo(options: {
  modelId: string;
  partsRoot: Object3D;
  nodes: readonly Object3D[];
  beforeSelectUuids: readonly string[];
  afterSelectUuids: readonly string[];
  mutate: () => boolean;
}): boolean {
  const { modelId, partsRoot, nodes } = options;
  const beforePlacements = nodes.map((node) =>
    snapshotHierarchyPlacement(node, partsRoot),
  );

  if (!options.mutate()) {
    return false;
  }

  const afterPlacements = nodes.map((node) =>
    snapshotHierarchyPlacement(node, partsRoot),
  );

  pushUndoableCommand({
    id: 'createHierarchy',
    modelId,
    before: {
      modelId,
      ensureGroups: [],
      removeGroupUuids: [],
      placements: beforePlacements,
      selectUuids: options.beforeSelectUuids,
    },
    after: {
      modelId,
      ensureGroups: [],
      removeGroupUuids: [],
      placements: afterPlacements,
      selectUuids: options.afterSelectUuids,
    },
  });
  return true;
}
