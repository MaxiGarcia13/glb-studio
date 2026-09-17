import type { Mesh, Object3D } from 'three';
import type { CreatePartClipboardEntry } from '../types/create-part-clipboard';

import {
  findMeshStandardMaterial,
  toHexColor,
} from '../utils/selected-part';
import { DUPLICATE_PART_OFFSET } from './duplicate-part';
import { readCreatePart } from './part-data';
import { getPartKind } from './part-kind';
import { nextPartName } from './part-name';

/** Snapshot a stamped create part for the in-session clipboard, or null. */
export function snapshotCreatePart(source: Mesh): CreatePartClipboardEntry | null {
  const record = readCreatePart(source);
  if (!record) {
    return null;
  }

  const material = findMeshStandardMaterial(source);

  return {
    kind: record.kind,
    params: { ...record.params },
    colorHex: material ? toHexColor(material) : null,
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

/**
 * Instantiate a clipboard snapshot into `sceneRoot`: fresh mesh, unique name,
 * slight +X offset so it is not stacked on the source pose.
 */
export function instantiateCreatePartSnapshot(
  entry: CreatePartClipboardEntry,
  sceneRoot: Object3D,
): Mesh {
  const kind = getPartKind(entry.kind);
  const mesh = kind.createMesh({ ...entry.params });

  mesh.position.set(
    entry.position[0] + DUPLICATE_PART_OFFSET,
    entry.position[1],
    entry.position[2],
  );
  mesh.quaternion.set(
    entry.quaternion[0],
    entry.quaternion[1],
    entry.quaternion[2],
    entry.quaternion[3],
  );
  mesh.scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
  mesh.name = nextPartName(sceneRoot, entry.kind);

  if (entry.colorHex) {
    const material = findMeshStandardMaterial(mesh);
    if (material) {
      material.color.set(entry.colorHex);
    }
  }

  sceneRoot.add(mesh);
  return mesh;
}
