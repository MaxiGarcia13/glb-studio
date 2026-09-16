import type { Mesh, Object3D } from 'three';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { ungroupPartsToRoot } from '../domain/parent-part';
import { readCreatePart } from '../domain/part-data';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { asMesh } from '../utils/selected-part';

export interface UngroupPartsAvailability {
  enabled: boolean;
  reason: string;
}

interface UngroupPartsContext {
  parts: Mesh[];
  partsRoot: Object3D;
}

function resolveUngroupPartsContext(): UngroupPartsContext | null {
  const { kind, object, objects } = $selection.get();
  if (kind !== 'parts' || objects.length === 0) {
    return null;
  }

  const models = $model.get().models;
  const anchorObject = object ?? objects[0]!;
  const anchor = asMesh(anchorObject);
  if (!anchor || !readCreatePart(anchor)) {
    return null;
  }

  const owner = findModelEntryForObject(anchor, models);
  if (!owner || owner.source !== 'created') {
    return null;
  }

  const parts: Mesh[] = [];
  for (const entry of objects) {
    const mesh = asMesh(entry);
    if (!mesh || !readCreatePart(mesh)) {
      continue;
    }
    if (findModelEntryForObject(mesh, models)?.id !== owner.id) {
      continue;
    }
    parts.push(mesh);
  }

  if (parts.length === 0) {
    return null;
  }

  return { parts, partsRoot: owner.scene };
}

/** Whether Ungroup is available for the current part selection. */
export function getUngroupPartsAvailability(): UngroupPartsAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Ungrouping models coming next' };
  }

  if (kind !== 'parts') {
    return { enabled: false, reason: 'Select parts to ungroup' };
  }

  if (objects.length === 0) {
    return { enabled: false, reason: 'Select parts to ungroup' };
  }

  const context = resolveUngroupPartsContext();
  if (!context) {
    return {
      enabled: false,
      reason: 'Selection must be create parts on a created model',
    };
  }

  const nested = context.parts.some(
    (part) => part.parent !== context.partsRoot,
  );
  if (!nested) {
    return { enabled: false, reason: 'Selected parts are already at the root' };
  }

  return {
    enabled: true,
    reason: 'Move selected parts to the parts root',
  };
}

/**
 * Unparent selected create parts to the model parts root.
 * World transform preserved. No-ops parts already at root.
 */
export function ungroupSelectedParts(): boolean {
  const context = resolveUngroupPartsContext();
  if (!context) {
    return false;
  }

  const moved = ungroupPartsToRoot(context.parts, context.partsRoot);
  if (moved === 0) {
    return false;
  }

  bumpCreatePartsRevision();
  return true;
}
