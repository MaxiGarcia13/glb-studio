import type { Object3D } from 'three';
import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import { findModelEntryForObject } from '@/modules/viewport/domain/model-scene';
import { $model } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import {
  snapshotHierarchyGroupSpec,
  snapshotHierarchyPlacement,
} from '../domain/create-hierarchy-undo';
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
  modelId: string;
  nodes: Object3D[];
  partsRoot: Object3D;
}

function resolveMultiPartContext(): GroupPartsContext | null {
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

  return { modelId: owner.id, nodes, partsRoot: owner.scene };
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

/** Shared by Group and Make joint (≥2 create nodes on one created model). */
export function resolveGroupPartsContext(): GroupPartsContext | null {
  return resolveMultiPartContext();
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

  const context = resolveMultiPartContext();
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
 * Create an organizational create group and parent selected nodes under it.
 * World transforms preserved. Selects the new group.
 */
export function groupSelectedParts(): boolean {
  const context = resolveMultiPartContext();
  if (!context) {
    return false;
  }

  const beforeSelect = context.nodes.map((node) => node.uuid);
  const beforePlacements = context.nodes.map((node) =>
    snapshotHierarchyPlacement(node, context.partsRoot),
  );

  context.partsRoot.updateMatrixWorld(true);
  const worldPivot = averageWorldPosition(context.nodes);
  const group = createEmptyPartGroup(context.partsRoot, {
    worldPivot,
    role: 'group',
  });
  const moved = attachAllUnder(group, context.nodes, context.partsRoot);
  if (moved === 0) {
    group.removeFromParent();
    return false;
  }

  const groupSpec = snapshotHierarchyGroupSpec(group);
  if (!groupSpec) {
    group.removeFromParent();
    return false;
  }

  const afterPlacements = [
    snapshotHierarchyPlacement(group, context.partsRoot),
    ...context.nodes.map((node) =>
      snapshotHierarchyPlacement(node, context.partsRoot),
    ),
  ];

  pushUndoableCommand({
    id: 'createHierarchy',
    modelId: context.modelId,
    before: {
      modelId: context.modelId,
      ensureGroups: [],
      removeGroupUuids: [group.uuid],
      placements: beforePlacements,
      selectUuids: beforeSelect,
    },
    after: {
      modelId: context.modelId,
      ensureGroups: [groupSpec],
      removeGroupUuids: [],
      placements: afterPlacements,
      selectUuids: [group.uuid],
    },
  });

  selectObject(group);
  bumpCreatePartsRevision();
  return true;
}
