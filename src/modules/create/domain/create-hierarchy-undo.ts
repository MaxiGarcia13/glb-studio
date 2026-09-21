import type { Object3D } from 'three';
import type {
  CreateHierarchyGroupSpec,
  CreateHierarchyPlacement,
  CreateHierarchySnapshot,
} from '@/modules/animation/types/undo-stack';

import { Group } from 'three';
import { refreshRestPoseNode } from '@/modules/animation/domain/rest-pose';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import {
  isCreateGroup,
  isCreateHierarchyNode,
  readCreateGroup,
  writeCreateGroup,
  writeCreateJoint,
} from './group-data';

function readTrs(node: Object3D): Pick<
  CreateHierarchyPlacement,
  'position' | 'quaternion' | 'scale'
> {
  return {
    position: [node.position.x, node.position.y, node.position.z],
    quaternion: [
      node.quaternion.x,
      node.quaternion.y,
      node.quaternion.z,
      node.quaternion.w,
    ],
    scale: [node.scale.x, node.scale.y, node.scale.z],
  };
}

function writeTrs(
  node: Object3D,
  trs: Pick<CreateHierarchyPlacement, 'position' | 'quaternion' | 'scale'>,
): void {
  node.position.set(trs.position[0], trs.position[1], trs.position[2]);
  node.quaternion.set(
    trs.quaternion[0],
    trs.quaternion[1],
    trs.quaternion[2],
    trs.quaternion[3],
  );
  node.scale.set(trs.scale[0], trs.scale[1], trs.scale[2]);
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

export function snapshotHierarchyPlacement(
  node: Object3D,
  partsRoot: Object3D,
): CreateHierarchyPlacement {
  return {
    nodeUuid: node.uuid,
    parentUuid: hierarchyParentUuid(node, partsRoot),
    ...readTrs(node),
  };
}

export function snapshotHierarchyGroupSpec(
  group: Object3D,
): CreateHierarchyGroupSpec | null {
  const meta = readCreateGroup(group);
  if (!meta) {
    return null;
  }
  return {
    uuid: group.uuid,
    name: group.name,
    role: meta.kind,
  };
}

/** All stamped create parts / groups under `partsRoot` (depth-first). */
export function listCreateHierarchyNodes(partsRoot: Object3D): Object3D[] {
  const nodes: Object3D[] = [];
  partsRoot.traverse((object) => {
    if (object === partsRoot) {
      return;
    }
    if (isCreateHierarchyNode(object)) {
      nodes.push(object);
    }
  });
  return nodes;
}

export function listCreateGroups(partsRoot: Object3D): Object3D[] {
  return listCreateHierarchyNodes(partsRoot).filter((node) => isCreateGroup(node));
}

/**
 * Capture a full hierarchy snapshot of the create graph (identity + placements).
 * `removeGroupUuids` is filled by the caller when comparing before/after.
 */
export function captureCreateHierarchySnapshot(
  modelId: string,
  partsRoot: Object3D,
  options?: {
    ensureGroups?: readonly CreateHierarchyGroupSpec[];
    removeGroupUuids?: readonly string[];
    selectUuids?: readonly string[];
  },
): CreateHierarchySnapshot {
  const groups = listCreateGroups(partsRoot);
  const nodes = listCreateHierarchyNodes(partsRoot);
  return {
    modelId,
    ensureGroups: options?.ensureGroups
      ?? groups
        .map((group) => snapshotHierarchyGroupSpec(group))
        .filter((entry): entry is CreateHierarchyGroupSpec => entry !== null),
    removeGroupUuids: options?.removeGroupUuids ?? [],
    placements: nodes.map((node) => snapshotHierarchyPlacement(node, partsRoot)),
    selectUuids: options?.selectUuids ?? [],
  };
}

function findUnderRoot(partsRoot: Object3D, uuid: string): Object3D | null {
  if (partsRoot.uuid === uuid) {
    return partsRoot;
  }
  return partsRoot.getObjectByProperty('uuid', uuid) ?? null;
}

function ensureGroup(
  partsRoot: Object3D,
  spec: CreateHierarchyGroupSpec,
): Object3D {
  const existing = findUnderRoot(partsRoot, spec.uuid);
  if (existing) {
    existing.name = spec.name;
    if (spec.role === 'joint') {
      writeCreateJoint(existing);
    } else {
      writeCreateGroup(existing);
    }
    return existing;
  }

  const group = new Group();
  group.uuid = spec.uuid;
  group.name = spec.name;
  if (spec.role === 'joint') {
    writeCreateJoint(group);
  } else {
    writeCreateGroup(group);
  }
  partsRoot.add(group);
  return group;
}

function resolveParent(
  partsRoot: Object3D,
  parentUuid: string | null,
): Object3D {
  if (parentUuid === null) {
    return partsRoot;
  }
  return findUnderRoot(partsRoot, parentUuid) ?? partsRoot;
}

function applyPlacement(
  partsRoot: Object3D,
  placement: CreateHierarchyPlacement,
): Object3D | null {
  const node = findUnderRoot(partsRoot, placement.nodeUuid);
  if (!node) {
    return null;
  }

  const parent = resolveParent(partsRoot, placement.parentUuid);
  if (node.parent !== parent) {
    parent.add(node);
  }
  writeTrs(node, placement);
  return node;
}

function removeGroup(partsRoot: Object3D, uuid: string): void {
  const group = findUnderRoot(partsRoot, uuid);
  if (!group || !isCreateGroup(group)) {
    return;
  }

  const destination = group.parent && group.parent !== group
    ? group.parent
    : partsRoot;
  for (const child of [...group.children]) {
    if (isCreateHierarchyNode(child)) {
      destination.add(child);
    }
  }
  group.removeFromParent();
}

function restoreSelection(
  partsRoot: Object3D,
  selectUuids: readonly string[],
): void {
  const nodes = selectUuids
    .map((uuid) => findUnderRoot(partsRoot, uuid))
    .filter((node): node is Object3D => node !== null && isCreateHierarchyNode(node));

  if (nodes.length === 0) {
    $selection.set({
      object: null,
      objects: [],
      modelIds: [],
      kind: 'none',
    });
    return;
  }

  // Set selection directly — avoid selectObject’s pose flush mid-undo/redo.
  $selection.set({
    object: nodes[nodes.length - 1]!,
    objects: nodes,
    modelIds: [],
    kind: 'parts',
  });
}

/** Apply a create-hierarchy undo/redo snapshot onto the live model scene. */
export function applyCreateHierarchySnapshot(
  snapshot: CreateHierarchySnapshot,
): void {
  const model = $model.get().models.find((entry) => entry.id === snapshot.modelId);
  if (!model || model.source !== 'created') {
    return;
  }

  const partsRoot = model.scene;
  for (const spec of snapshot.ensureGroups) {
    ensureGroup(partsRoot, spec);
  }

  // Parents before children when possible (stable multi-pass).
  const pending = [...snapshot.placements];
  for (let pass = 0; pass < pending.length + 1 && pending.length > 0; pass += 1) {
    let progressed = false;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const placement = pending[index]!;
      const parentReady
        = placement.parentUuid === null
          || findUnderRoot(partsRoot, placement.parentUuid) !== null
          || placement.parentUuid === placement.nodeUuid;
      if (!parentReady && placement.parentUuid !== null) {
        continue;
      }
      const node = applyPlacement(partsRoot, placement);
      if (node) {
        refreshRestPoseNode(partsRoot, node);
      }
      pending.splice(index, 1);
      progressed = true;
    }
    if (!progressed) {
      break;
    }
  }

  for (const leftover of pending) {
    const node = applyPlacement(partsRoot, leftover);
    if (node) {
      refreshRestPoseNode(partsRoot, node);
    }
  }

  for (const uuid of snapshot.removeGroupUuids) {
    removeGroup(partsRoot, uuid);
  }

  partsRoot.updateMatrixWorld(true);
  restoreSelection(partsRoot, snapshot.selectUuids);
  bumpCreatePartsRevision();
}
