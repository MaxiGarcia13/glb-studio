import type { Object3D } from 'three';

import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import { snapshotCreateSceneTrees } from '../domain/create-scene-undo';
import { deleteCreateHierarchyRoots } from '../domain/delete-part';

/**
 * Push a createScene undo entry around inserting live roots (Add / Paste).
 * Call after the roots already exist in the scene.
 */
export function pushCreateSceneInsertUndo(options: {
  modelId: string;
  partsRoot: Object3D;
  insertedRoots: readonly Object3D[];
  beforeSelectUuids: readonly string[];
}): void {
  const { modelId, partsRoot, insertedRoots, beforeSelectUuids } = options;
  if (insertedRoots.length === 0) {
    return;
  }

  const afterTrees = snapshotCreateSceneTrees(insertedRoots, partsRoot);
  if (afterTrees.length === 0) {
    return;
  }

  const insertedUuids = afterTrees.map((tree) => {
    const uuid = tree.node.uuid;
    if (!uuid) {
      throw new Error('createScene insert snapshot missing root uuid');
    }
    return uuid;
  });

  pushUndoableCommand({
    id: 'createScene',
    modelId,
    before: {
      modelId,
      ensureTrees: [],
      removeRootUuids: insertedUuids,
      selectUuids: beforeSelectUuids,
    },
    after: {
      modelId,
      ensureTrees: afterTrees,
      removeRootUuids: [],
      selectUuids: insertedRoots.map((root) => root.uuid),
    },
  });
}

/**
 * Snapshot roots, delete them, push createScene undo. Returns false if nothing
 * was deleted.
 */
export function pushCreateSceneDeleteUndo(options: {
  modelId: string;
  partsRoot: Object3D;
  roots: readonly Object3D[];
  beforeSelectUuids: readonly string[];
}): boolean {
  const { modelId, partsRoot, roots, beforeSelectUuids } = options;
  if (roots.length === 0) {
    return false;
  }

  const beforeTrees = snapshotCreateSceneTrees(roots, partsRoot);
  if (beforeTrees.length === 0) {
    return false;
  }

  const removeRootUuids = beforeTrees.map((tree) => {
    const uuid = tree.node.uuid;
    if (!uuid) {
      throw new Error('createScene delete snapshot missing root uuid');
    }
    return uuid;
  });

  const removed = deleteCreateHierarchyRoots(roots);
  if (removed === 0) {
    return false;
  }

  pushUndoableCommand({
    id: 'createScene',
    modelId,
    before: {
      modelId,
      ensureTrees: beforeTrees,
      removeRootUuids: [],
      selectUuids: beforeSelectUuids,
    },
    after: {
      modelId,
      ensureTrees: [],
      removeRootUuids,
      selectUuids: [],
    },
  });
  return true;
}
