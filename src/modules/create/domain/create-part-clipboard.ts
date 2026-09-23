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
import { isCreateGroup, readCreateGroup, writeCreateGroup, writeCreateJoint } from './group-data';
import { nextObjectName } from './object-name';
import { isStrictDescendantOf } from './parent-part';
import { readCreatePart } from './part-data';
import { getPartKind } from './part-kind';
import { nextPartName } from './part-name';

export interface SnapshotClipboardOptions {
  /** Include Object3D.uuid (+ exact name) for undo restore (US-37). */
  includeIdentity?: boolean;
}

export interface InstantiateClipboardOptions {
  /** Local +X on each payload root. Default: paste offset. Pass `0` for undo. */
  rootOffsetX?: number;
  /**
   * Assign recorded uuids and exact names. When false (user paste), mint unique
   * names and leave Three.js uuids alone.
   */
  preserveIdentity?: boolean;
  /**
   * Parent for each payload root. Default: always `sceneRoot`.
   * Index matches `payload.roots`.
   */
  resolveRootParent?: (rootIndex: number) => Object3D;
}

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
  options?: SnapshotClipboardOptions,
): CreatePartClipboardPartNode | null {
  const record = readCreatePart(source);
  if (!record) {
    return null;
  }

  const material = findMeshStandardMaterial(source);

  const node: CreatePartClipboardPartNode = {
    type: 'part',
    kind: record.kind,
    params: { ...record.params },
    colorHex: material ? toHexColor(material) : null,
    ...readTrs(source),
  };

  if (options?.includeIdentity) {
    node.uuid = source.uuid;
    node.name = source.name || undefined;
  }

  return node;
}

/** Snapshot a create group (and stamped descendants), or null. */
export function snapshotCreateGroup(
  source: Object3D,
  options?: SnapshotClipboardOptions,
): CreatePartClipboardGroupNode | null {
  if (!isCreateGroup(source)) {
    return null;
  }

  const children: CreatePartClipboardNode[] = [];
  for (const child of source.children) {
    const node = snapshotCreateHierarchyNode(child, options);
    if (node) {
      children.push(node);
    }
  }

  const node: CreatePartClipboardGroupNode = {
    type: 'group',
    role: readCreateGroup(source)?.kind ?? 'group',
    name: source.name || undefined,
    ...readTrs(source),
    children,
  };

  if (options?.includeIdentity) {
    node.uuid = source.uuid;
  }

  return node;
}

/** Snapshot a stamped part or create group, or null. */
export function snapshotCreateHierarchyNode(
  source: Object3D,
  options?: SnapshotClipboardOptions,
): CreatePartClipboardNode | null {
  if (isCreateGroup(source)) {
    return snapshotCreateGroup(source, options);
  }
  const mesh = source as Mesh;
  if (mesh.isMesh) {
    return snapshotCreatePart(mesh, options);
  }
  return null;
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
  options?: SnapshotClipboardOptions,
): CreatePartClipboardPayload | null {
  const nodes: CreatePartClipboardNode[] = [];
  for (const root of roots) {
    const node = snapshotCreateHierarchyNode(root, options);
    if (node) {
      nodes.push(node);
    }
  }
  if (nodes.length === 0) {
    return null;
  }
  return { roots: nodes };
}

function assignIdentity(target: Object3D, uuid: string | undefined, name: string | undefined): void {
  if (uuid) {
    target.uuid = uuid;
  }
  if (name !== undefined) {
    target.name = name;
  }
}

function instantiatePartNode(
  entry: CreatePartClipboardPartNode,
  sceneRoot: Object3D,
  parent: Object3D,
  offsetX: number,
  preserveIdentity: boolean,
): Mesh {
  const kind = getPartKind(entry.kind);
  const mesh = kind.createMesh({ ...entry.params });
  applyTrs(mesh, entry, offsetX);

  if (preserveIdentity) {
    assignIdentity(mesh, entry.uuid, entry.name);
    if (!entry.name) {
      mesh.name = nextPartName(sceneRoot, entry.kind);
    }
  } else {
    mesh.name = nextPartName(sceneRoot, entry.kind);
  }

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
  preserveIdentity: boolean,
): Group {
  const role = entry.role === 'joint' ? 'joint' : 'group';
  const baseName = entry.name?.trim()
    || (role === 'joint' ? 'joint' : 'group');
  const group = new ThreeGroup();

  if (preserveIdentity) {
    assignIdentity(group, entry.uuid, entry.name);
    if (!entry.name) {
      group.name = nextObjectName(sceneRoot, baseName);
    }
  } else {
    group.name = nextObjectName(sceneRoot, baseName);
  }

  if (role === 'joint') {
    writeCreateJoint(group);
  } else {
    writeCreateGroup(group);
  }
  applyTrs(group, entry, offsetX);
  parent.add(group);

  for (const child of entry.children) {
    instantiateClipboardNode(child, sceneRoot, group, 0, preserveIdentity);
  }

  return group;
}

function instantiateClipboardNode(
  entry: CreatePartClipboardNode,
  sceneRoot: Object3D,
  parent: Object3D,
  offsetX: number,
  preserveIdentity: boolean,
): Object3D {
  if (entry.type === 'group') {
    return instantiateGroupNode(entry, sceneRoot, parent, offsetX, preserveIdentity);
  }
  return instantiatePartNode(entry, sceneRoot, parent, offsetX, preserveIdentity);
}

/**
 * Instantiate a clipboard payload into `sceneRoot`.
 * Default (user paste): unique names, slight +X offset on each root.
 * Undo restore: `preserveIdentity: true`, `rootOffsetX: 0`, custom parents.
 */
export function instantiateClipboardPayload(
  payload: CreatePartClipboardPayload,
  sceneRoot: Object3D,
  options?: InstantiateClipboardOptions,
): Object3D[] {
  const offsetX = options?.rootOffsetX ?? DUPLICATE_PART_OFFSET;
  const preserveIdentity = options?.preserveIdentity ?? false;
  const resolveParent = options?.resolveRootParent ?? (() => sceneRoot);

  return payload.roots.map((root, index) =>
    instantiateClipboardNode(
      root,
      sceneRoot,
      resolveParent(index),
      offsetX,
      preserveIdentity,
    ),
  );
}
