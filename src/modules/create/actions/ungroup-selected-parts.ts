import type { Object3D } from 'three';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import {
  isCreateHierarchyNode,
  isCreatePlainGroup,
} from '../domain/group-data';
import {
  dissolveCreateGroups,
  ungroupPartsToRoot,
} from '../domain/parent-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';

export interface UngroupPartsAvailability {
  enabled: boolean;
  reason: string;
}

interface UngroupPartsContext {
  nodes: Object3D[];
  groups: Object3D[];
  /** Parts/joints whose direct parent is a plain create group. */
  nestedInPlainGroup: Object3D[];
  partsRoot: Object3D;
}

function resolveUngroupPartsContext(): UngroupPartsContext | null {
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

  const nodes: Object3D[] = [];
  const groups: Object3D[] = [];
  const nestedInPlainGroup: Object3D[] = [];
  for (const entry of objects) {
    if (!isCreateHierarchyNode(entry)) {
      continue;
    }
    if (findModelEntryForObject(entry, models)?.id !== owner.id) {
      continue;
    }
    nodes.push(entry);
    if (isCreatePlainGroup(entry)) {
      groups.push(entry);
    }
    if (entry.parent && isCreatePlainGroup(entry.parent)) {
      nestedInPlainGroup.push(entry);
    }
  }

  if (nodes.length === 0) {
    return null;
  }

  return { nodes, groups, nestedInPlainGroup, partsRoot: owner.scene };
}

/** Whether Ungroup is available (plain groups or parts inside them). */
export function getUngroupPartsAvailability(): UngroupPartsAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Use Ungroup while models are selected' };
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

  if (context.groups.length > 0) {
    return {
      enabled: true,
      reason: 'Dissolve selected group(s) and keep children',
    };
  }

  if (context.nestedInPlainGroup.length > 0) {
    return {
      enabled: true,
      reason: 'Move selected parts out of their group',
    };
  }

  return {
    enabled: false,
    reason: 'Select a group, or parts inside a group',
  };
}

/**
 * Dissolve selected plain groups, or lift parts that sit directly under a
 * plain group to the parts root. Does not dissolve joints — use Unjoint.
 */
export function ungroupSelectedParts(): boolean {
  const context = resolveUngroupPartsContext();
  if (!context) {
    return false;
  }

  if (context.groups.length > 0) {
    const childrenBefore = context.groups.flatMap((group) => [...group.children]);
    const dissolved = dissolveCreateGroups(context.groups, context.partsRoot);
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

  if (context.nestedInPlainGroup.length === 0) {
    return false;
  }

  const moved = ungroupPartsToRoot(
    context.nestedInPlainGroup,
    context.partsRoot,
  );
  if (moved === 0) {
    return false;
  }

  bumpCreatePartsRevision();
  return true;
}
