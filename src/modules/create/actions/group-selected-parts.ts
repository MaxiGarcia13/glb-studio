import type { Object3D } from 'three';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import {
  averageWorldPosition,
  createEmptyPartGroup,
} from '../domain/create-part-group';
import { isCreateHierarchyNode } from '../domain/group-data';
import { attachAllUnder } from '../domain/parent-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';

export interface GroupPartsAvailability {
  enabled: boolean;
  reason: string;
}

interface GroupPartsContext {
  nodes: Object3D[];
  partsRoot: Object3D;
}

function resolveGroupPartsContext(): GroupPartsContext | null {
  const { kind, objects } = $selection.get();
  if (kind !== 'parts' || objects.length < 2) {
    return null;
  }

  const models = $model.get().models;
  const anchor = objects[0]!;
  const owner = findModelEntryForObject(anchor, models);
  if (!owner || owner.source !== 'created') {
    return null;
  }

  const nodes: Object3D[] = [];
  for (const entry of objects) {
    if (!isCreateHierarchyNode(entry)) {
      continue;
    }
    if (findModelEntryForObject(entry, models)?.id !== owner.id) {
      continue;
    }
    // Skip nodes that are descendants of another selected node (would nest twice).
    const nestedUnderSelection = objects.some(
      (other) =>
        other !== entry
        && (entry.parent === other || isDescendant(entry, other)),
    );
    if (nestedUnderSelection) {
      continue;
    }
    nodes.push(entry);
  }

  if (nodes.length < 2) {
    return null;
  }

  return { nodes, partsRoot: owner.scene };
}

function isDescendant(object: Object3D, ancestor: Object3D): boolean {
  let current: Object3D | null = object.parent;
  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/** Whether Group is available for the current part multi-selection. */
export function getGroupPartsAvailability(): GroupPartsAvailability {
  const { kind, objects } = $selection.get();

  if (kind === 'models') {
    return { enabled: false, reason: 'Use Group while models are selected' };
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
      reason: 'Select two or more create parts on the same created model',
    };
  }

  return {
    enabled: true,
    reason: 'Create a group and put the selection under it',
  };
}

/**
 * Create an empty group and parent all selected create nodes under it.
 * World transforms preserved. Selects the new group.
 */
export function groupSelectedParts(): boolean {
  const context = resolveGroupPartsContext();
  if (!context) {
    return false;
  }

  context.partsRoot.updateMatrixWorld(true);
  const worldPivot = averageWorldPosition(context.nodes);
  const group = createEmptyPartGroup(context.partsRoot, { worldPivot });
  const moved = attachAllUnder(group, context.nodes, context.partsRoot);
  if (moved === 0) {
    group.removeFromParent();
    return false;
  }

  selectObject(group);
  bumpCreatePartsRevision();
  return true;
}
