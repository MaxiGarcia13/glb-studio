import type { BufferGeometry, Mesh } from 'three';
import type {
  PartKind,
  PartKindId,
  PartSizeParamKey,
  PartSizeParams,
} from '@/modules/create/types/part';
import { PART_KIND_GROUPS } from '@/modules/create/constants/part-kind-groups';

import { PART_KINDS } from '../constants/part-kinds';
import { readCreatePart, writeCreatePart } from './part-data';

export type { PartKind };

export { PART_KINDS };

export function getPartKind<K extends PartKindId>(id: K): PartKind<K> {
  return PART_KINDS[id];
}

export function listPartKinds(): PartKind[] {
  return Object.values(PART_KINDS) as PartKind[];
}

export interface PartKindGroup {
  id: string;
  label: string;
  kinds: PartKind[];
}

/** All registered kinds sectioned for the Add-part browse modal. */
export function listPartKindGroups(): PartKindGroup[] {
  return PART_KIND_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    kinds: group.kindIds.map((id) => getPartKind(id)),
  }));
}

/**
 * Rebuild mesh geometry from kind size params. Keeps material and local TRS.
 * No-op when the mesh is not a stamped create part or the param is not for its kind.
 */
export function setPartSizeParam(
  mesh: Mesh,
  param: PartSizeParamKey,
  value: number,
): void {
  if (!Number.isFinite(value)) {
    return;
  }

  const record = readCreatePart(mesh);
  if (!record) {
    return;
  }

  const kind = getPartKind(record.kind);
  const field = kind.sizeFields.find((entry) => entry.param === param);
  if (!field) {
    return;
  }

  const clamped = Math.max(field.min, value);
  const nextValue = field.integer ? Math.round(clamped) : clamped;
  if (field.integer && nextValue < field.min) {
    return;
  }

  const nextParams = { ...record.params, [param]: nextValue };
  const createGeometry = kind.createGeometry as (
    params: PartSizeParams,
  ) => BufferGeometry;

  mesh.geometry.dispose();
  mesh.geometry = createGeometry(nextParams);
  writeCreatePart(mesh, { kind: record.kind, params: nextParams });
}
