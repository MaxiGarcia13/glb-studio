import type { Mesh, Object3D } from 'three';
import type {
  CreatePartClipboardGroupNode,
  CreatePartClipboardNode,
  CreatePartClipboardPartNode,
  CreatePartClipboardPayload,
} from '@/modules/create/types/create-part-clipboard';
import { readCreatePart } from '@/modules/create/domain/part-data';
import {
  findMeshStandardMaterial,
  toHexColor,
} from '@/modules/create/utils/selected-part';
import {
  isCreateGroup,
  readCreateGroup,
} from '../group-data';
import { resolveHierarchyRoots } from '../parent-part';
import { readTrs } from './trs';

export interface SnapshotClipboardOptions {
  /** Include Object3D.uuid (+ exact name) for undo restore (US-37). */
  includeIdentity?: boolean;
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
  return resolveHierarchyRoots(objects);
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
