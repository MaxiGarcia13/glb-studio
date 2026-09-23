import type { Object3D } from 'three';
import type {
  CreateSceneSnapshot,
  CreateSceneTreeRoot,
} from '@/modules/animation/types/undo-stack';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { SelectionState } from '@/modules/viewport/types/selection';

import { refreshRestPoseNode } from '@/modules/animation/domain/rest-pose';
import { bumpCreatePartsRevision } from '@/modules/create/stores/create-parts-revision-store';
import {
  findUnderRoot,
  hierarchyParentUuid,
  resolveCreateSelection,
  resolveHierarchyParent,
} from './create-graph-lookup';
import {
  instantiateClipboardPayload,
  snapshotCreateHierarchyNode,
} from './create-part-clipboard';
import { deleteCreateHierarchyRoot } from './delete-part';
import { isCreateHierarchyNode } from './group-data';

/** Snapshot live roots as createScene ensureTrees (stable identity). */
export function snapshotCreateSceneTrees(
  roots: readonly Object3D[],
  partsRoot: Object3D,
): CreateSceneTreeRoot[] {
  const trees: CreateSceneTreeRoot[] = [];
  for (const root of roots) {
    const node = snapshotCreateHierarchyNode(root, { includeIdentity: true });
    if (!node) {
      continue;
    }
    trees.push({
      parentUuid: hierarchyParentUuid(root, partsRoot),
      node,
    });
  }
  return trees;
}

function ensureTree(
  partsRoot: Object3D,
  tree: CreateSceneTreeRoot,
): Object3D | null {
  const existingUuid = tree.node.uuid;
  if (existingUuid) {
    const existing = findUnderRoot(partsRoot, existingUuid);
    if (existing) {
      return existing;
    }
  }

  const parent = resolveHierarchyParent(partsRoot, tree.parentUuid);
  const [created] = instantiateClipboardPayload(
    { roots: [tree.node] },
    partsRoot,
    {
      rootOffsetX: 0,
      preserveIdentity: true,
      resolveRootParent: () => parent,
    },
  );
  return created ?? null;
}

function removeRoot(partsRoot: Object3D, uuid: string): void {
  const node = findUnderRoot(partsRoot, uuid);
  if (!node || !isCreateHierarchyNode(node)) {
    return;
  }
  deleteCreateHierarchyRoot(node);
}

/** Apply a createScene undo/redo snapshot onto the live model scene. */
export function applyCreateSceneSnapshot(
  snapshot: CreateSceneSnapshot,
  models: readonly ModelEntry[],
): SelectionState | null {
  const model = models.find((entry) => entry.id === snapshot.modelId);
  if (!model || model.source !== 'created') {
    return null;
  }

  const partsRoot = model.scene;

  for (const tree of snapshot.ensureTrees) {
    const node = ensureTree(partsRoot, tree);
    if (node) {
      refreshRestPoseNode(partsRoot, node);
      node.traverse((child) => {
        if (child !== node && isCreateHierarchyNode(child)) {
          refreshRestPoseNode(partsRoot, child);
        }
      });
    }
  }

  for (const uuid of snapshot.removeRootUuids) {
    removeRoot(partsRoot, uuid);
  }

  partsRoot.updateMatrixWorld(true);
  bumpCreatePartsRevision();
  return resolveCreateSelection(partsRoot, snapshot.selectUuids);
}
