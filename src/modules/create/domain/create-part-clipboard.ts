import type { Group, Mesh, Object3D } from 'three';
import type {
  CreatePartClipboardGroupNode,
  CreatePartClipboardNode,
  CreatePartClipboardPartNode,
  CreatePartClipboardPayload,
} from '../types/create-part-clipboard';

import { Group as ThreeGroup } from 'three';
import {
  findMeshStandardMaterial,
  toHexColor,
} from '../utils/selected-part';
import { DUPLICATE_PART_OFFSET } from './duplicate-part';
import { isCreateGroup, writeCreateGroup } from './group-data';
import { nextObjectName } from './object-name';
import { readCreatePart } from './part-data';
import { getPartKind } from './part-kind';
import { nextPartName } from './part-name';

function readTrs(source: Object3D): Pick<
  CreatePartClipboardPartNode,
  'position' | 'quaternion' | 'scale'
> {
  return {
    position: [source.position.x, source.position.y, source.position.z],
    quaternion: [
      source.quaternion.x,
      source.quaternion.y,
      source.quaternion.z,
      source.quaternion.w,
    ],
    scale: [source.scale.x, source.scale.y, source.scale.z],
  };
}

function applyTrs(
  target: Object3D,
  entry: Pick<CreatePartClipboardPartNode, 'position' | 'quaternion' | 'scale'>,
  offsetX = 0,
): void {
  target.position.set(
    entry.position[0] + offsetX,
    entry.position[1],
    entry.position[2],
  );
  target.quaternion.set(
    entry.quaternion[0],
    entry.quaternion[1],
    entry.quaternion[2],
    entry.quaternion[3],
  );
  target.scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
}

/** Snapshot a stamped create part for the in-session clipboard, or null. */
export function snapshotCreatePart(
  source: Mesh,
): CreatePartClipboardPartNode | null {
  const record = readCreatePart(source);
  if (!record) {
    return null;
  }

  const material = findMeshStandardMaterial(source);

  return {
    type: 'part',
    kind: record.kind,
    params: { ...record.params },
    colorHex: material ? toHexColor(material) : null,
    ...readTrs(source),
  };
}

/** Snapshot a create group (and stamped descendants), or null. */
export function snapshotCreateGroup(
  source: Object3D,
): CreatePartClipboardGroupNode | null {
  if (!isCreateGroup(source)) {
    return null;
  }

  const children: CreatePartClipboardNode[] = [];
  for (const child of source.children) {
    const node = snapshotCreateHierarchyNode(child);
    if (node) {
      children.push(node);
    }
  }

  return {
    type: 'group',
    ...readTrs(source),
    children,
  };
}

/** Snapshot a stamped part or create group, or null. */
export function snapshotCreateHierarchyNode(
  source: Object3D,
): CreatePartClipboardNode | null {
  if (isCreateGroup(source)) {
    return snapshotCreateGroup(source);
  }
  const mesh = source as Mesh;
  if (mesh.isMesh) {
    return snapshotCreatePart(mesh);
  }
  return null;
}

/** True when `object` is a descendant of `ancestor` (not equal). */
export function isStrictDescendantOf(
  object: Object3D,
  ancestor: Object3D,
): boolean {
  let current: Object3D | null = object.parent;
  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Roots among `objects` for clipboard: hierarchy nodes not nested under
 * another selected node (same rule as Group).
 */
export function resolveClipboardRoots(
  objects: readonly Object3D[],
): Object3D[] {
  const roots: Object3D[] = [];
  for (const entry of objects) {
    const nestedUnderSelection = objects.some(
      (other) =>
        other !== entry
        && (entry.parent === other || isStrictDescendantOf(entry, other)),
    );
    if (nestedUnderSelection) {
      continue;
    }
    roots.push(entry);
  }
  return roots;
}

/** Build a clipboard payload from hierarchy roots, or null when empty. */
export function snapshotClipboardFromRoots(
  roots: readonly Object3D[],
): CreatePartClipboardPayload | null {
  const nodes: CreatePartClipboardNode[] = [];
  for (const root of roots) {
    const node = snapshotCreateHierarchyNode(root);
    if (node) {
      nodes.push(node);
    }
  }
  if (nodes.length === 0) {
    return null;
  }
  return { roots: nodes };
}

function instantiatePartNode(
  entry: CreatePartClipboardPartNode,
  sceneRoot: Object3D,
  parent: Object3D,
  offsetX: number,
): Mesh {
  const kind = getPartKind(entry.kind);
  const mesh = kind.createMesh({ ...entry.params });
  applyTrs(mesh, entry, offsetX);
  mesh.name = nextPartName(sceneRoot, entry.kind);

  if (entry.colorHex) {
    const material = findMeshStandardMaterial(mesh);
    if (material) {
      material.color.set(entry.colorHex);
    }
  }

  parent.add(mesh);
  return mesh;
}

function instantiateGroupNode(
  entry: CreatePartClipboardGroupNode,
  sceneRoot: Object3D,
  parent: Object3D,
  offsetX: number,
): Group {
  const group = new ThreeGroup();
  group.name = nextObjectName(sceneRoot, 'group');
  writeCreateGroup(group);
  applyTrs(group, entry, offsetX);
  parent.add(group);

  for (const child of entry.children) {
    instantiateClipboardNode(child, sceneRoot, group, 0);
  }

  return group;
}

function instantiateClipboardNode(
  entry: CreatePartClipboardNode,
  sceneRoot: Object3D,
  parent: Object3D,
  offsetX: number,
): Object3D {
  if (entry.type === 'group') {
    return instantiateGroupNode(entry, sceneRoot, parent, offsetX);
  }
  return instantiatePartNode(entry, sceneRoot, parent, offsetX);
}

/**
 * Instantiate a clipboard payload into `sceneRoot`: unique names, slight +X
 * offset on each root so pasted nodes are not stacked on the source pose.
 * Returns the instantiated root objects in payload order.
 */
export function instantiateClipboardPayload(
  payload: CreatePartClipboardPayload,
  sceneRoot: Object3D,
): Object3D[] {
  return payload.roots.map((root) =>
    instantiateClipboardNode(root, sceneRoot, sceneRoot, DUPLICATE_PART_OFFSET),
  );
}
