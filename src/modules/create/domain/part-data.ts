import type { Mesh, Object3D } from 'three';
import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';

/** Mesh `userData` key for created-part kind + size params. */
export const CREATE_PART_USER_DATA_KEY = 'createPart';

const PART_KIND_IDS: ReadonlySet<string> = new Set([
  'box',
  'sphere',
  'cylinder',
  'capsule',
]);

export interface CreatePartUserData<K extends PartKindId = PartKindId> {
  kind: K;
  params: PartSizeParams<K>;
}

export function isPartKindId(value: unknown): value is PartKindId {
  return typeof value === 'string' && PART_KIND_IDS.has(value);
}

/** Read stamped create-part metadata, or null when missing / invalid. */
export function readCreatePart(object: Object3D): CreatePartUserData | null {
  const raw = object.userData[CREATE_PART_USER_DATA_KEY];
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const { kind, params } = raw as { kind?: unknown; params?: unknown };
  if (!isPartKindId(kind) || !params || typeof params !== 'object') {
    return null;
  }

  return {
    kind,
    params: { ...params } as PartSizeParams,
  };
}

export function writeCreatePart(mesh: Mesh, record: CreatePartUserData): void {
  mesh.userData[CREATE_PART_USER_DATA_KEY] = {
    kind: record.kind,
    params: { ...record.params },
  };
}
