import type { Mesh, Object3D } from 'three';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  canParentPart,
  groupPartsUnder,
} from '../domain/parent-part';
import { readCreatePart } from '../domain/part-data';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { asMesh } from '../utils/selected-part';

export interface GroupPartsAvailability {
  enabled: boolean;
  reason: string;
}

interface GroupPartsContext {
  active: Mesh;
  children: Mesh[];
  partsRoot: Object3D;
}

function resolveGroupPartsContext(): GroupPartsContext | null {
  const { kind, object, objects } = $selection.get();
  if (kind !== 'parts' || !object || objects.length < 2) {
    return null;
  }

  const active = asMesh(object);
  if (!active || !readCreatePart(active)) {
    return null;
  }

  const models = $model.get().models;
  const owner = findModelEntryForObject(active, models);
  if (!owner || owner.source !== 'created') {
    return null;
  }

  const children: Mesh[] = [];
  for (const entry of objects) {
    if (entry === active) {
      continue;
    }
    const mesh = asMesh(entry);
    if (!mesh || !readCreatePart(mesh)) {
      continue;
    }
    if (findModelEntryForObject(mesh, models)?.id !== owner.id) {
      continue;
    }
    children.push(mesh);
  }

  if (children.length === 0) {
    return null;
  }

  return { active, children, partsRoot: owner.scene };
}

/** Whether Group is available for the current part multi-selection. */
export function getGroupPartsAvailability(): GroupPartsAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Grouping models coming next' };
  }

  if (kind !== 'parts') {
    return { enabled: false, reason: 'Select parts to group' };
  }

  if (objects.length < 2) {
    return { enabled: false, reason: 'Select at least two parts' };
  }

  const context = resolveGroupPartsContext();
  if (!context) {
    return {
      enabled: false,
      reason: 'Active selection must be a create part on a created model',
    };
  }

  const { active, children, partsRoot } = context;
  const canMove = children.some(
    (child) =>
      child.parent !== active && canParentPart(child, active, partsRoot),
  );

  if (!canMove) {
    return {
      enabled: false,
      reason: 'Cannot group under the active part (already parented or would cycle)',
    };
  }

  return { enabled: true, reason: 'Group selected parts under the active part' };
}

/**
 * Parent non-active selected parts under the active (last-clicked) part.
 * Same created model only; cycle-safe; world transform preserved.
 */
export function groupSelectedParts(): boolean {
  const context = resolveGroupPartsContext();
  if (!context) {
    return false;
  }

  const moved = groupPartsUnder(
    context.active,
    context.children,
    context.partsRoot,
  );
  if (moved === 0) {
    return false;
  }

  bumpCreatePartsRevision();
  return true;
}
