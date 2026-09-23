import type { Group, Mesh, Object3D } from 'three';
import type {
  CreatePartClipboardGroupNode,
  CreatePartClipboardNode,
  CreatePartClipboardPartNode,
  CreatePartClipboardPayload,
} from '@/modules/create/types/create-part-clipboard';
import { Group as ThreeGroup } from 'three';
import { DUPLICATE_PART_OFFSET } from '@/modules/create/domain/duplicate-part';
import { nextObjectName } from '@/modules/create/domain/object-name';
import { getPartKind } from '@/modules/create/domain/part-kind';
import { nextPartName } from '@/modules/create/domain/part-name';
import { findMeshStandardMaterial } from '@/modules/create/utils/selected-part';
import { writeCreateGroup, writeCreateJoint } from '../group-data';
import { applyTrs } from './trs';

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

function assignIdentity(
  target: Object3D,
  uuid: string | undefined,
  name: string | undefined,
): void {
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
