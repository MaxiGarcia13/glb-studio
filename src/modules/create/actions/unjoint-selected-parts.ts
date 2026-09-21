import type { Object3D } from 'three';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import {
  isCreateHierarchyNode,
  isCreateJoint,
} from '../domain/group-data';
import { dissolveCreateGroups } from '../domain/parent-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';

export interface UnjointPartsAvailability {
  enabled: boolean;
  reason: string;
}

interface UnjointPartsContext {
  joints: Object3D[];
  partsRoot: Object3D;
}

function resolveUnjointPartsContext(): UnjointPartsContext | null {
  const { kind, objects } = $selection.get();
  if (kind !== 'parts' || objects.length === 0) {
    return null;
  }

  const models = $model.get().models;
  const anchor = objects[0]!;
  const owner = findModelEntryForObject(anchor, models);
  if (!owner || owner.source !== 'created') {
    return null;
  }

  const joints: Object3D[] = [];
  for (const entry of objects) {
    if (!isCreateJoint(entry)) {
      continue;
    }
    if (findModelEntryForObject(entry, models)?.id !== owner.id) {
      continue;
    }
    joints.push(entry);
  }

  if (joints.length === 0) {
    return null;
  }

  return { joints, partsRoot: owner.scene };
}

/** Whether Unjoint is available (selected joints only). */
export function getUnjointPartsAvailability(): UnjointPartsAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Unjoint applies to create parts' };
  }

  if (kind !== 'parts') {
    return { enabled: false, reason: 'Select a joint to unjoint' };
  }

  if (objects.length === 0) {
    return { enabled: false, reason: 'Select a joint to unjoint' };
  }

  const context = resolveUnjointPartsContext();
  if (!context) {
    return {
      enabled: false,
      reason: 'Select a joint (Make joint) to dissolve',
    };
  }

  return {
    enabled: true,
    reason: 'Dissolve selected joint(s) and keep children',
  };
}

/**
 * Dissolve selected joints. Children reparent to the former parent.
 * Plain groups are untouched — use Ungroup.
 */
export function unjointSelectedParts(): boolean {
  const context = resolveUnjointPartsContext();
  if (!context) {
    return false;
  }

  const childrenBefore = context.joints.flatMap((joint) => [...joint.children]);
  const dissolved = dissolveCreateGroups(context.joints, context.partsRoot);
  if (dissolved === 0) {
    return false;
  }

  const firstChild = childrenBefore.find((child) =>
    isCreateHierarchyNode(child),
  );
  if (firstChild) {
    selectObject(firstChild);
  }
  bumpCreatePartsRevision();
  return true;
}
