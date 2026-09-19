import type { Object3D } from 'three';

import type { PoseEditKind } from '../stores/pose-edit-store';
import { $editTool } from '../stores/edit-tool-store';
import { $model } from '../stores/model-store';
import { $selection } from '../stores/selection-store';

export type PositionEditSpace = 'local' | 'world';

export interface PositionEditTarget {
  object: Object3D;
  modelId: string;
}

export interface PositionEditTargets {
  targets: PositionEditTarget[];
  /** Primary readout / gizmo-aligned object (last-clicked when multi). */
  primary: Object3D | null;
  space: PositionEditSpace;
  poseKind: PoseEditKind;
}

function isStrictDescendantOf(object: Object3D, ancestor: Object3D): boolean {
  let current: Object3D | null = object.parent;
  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Roots among `objects`: skip nodes nested under another selected node
 * (same rule as Group / clipboard) so a parent+child multi-select does not
 * double-apply the delta to the child.
 */
export function resolveSelectionRoots(objects: readonly Object3D[]): Object3D[] {
  const roots: Object3D[] = [];
  for (const entry of objects) {
    const nestedUnderSelection = objects.some(
      (other) =>
        other !== entry
        && (entry.parent === other || isStrictDescendantOf(entry, other)),
    );
    if (nestedUnderSelection) {
      continue;
    }
    roots.push(entry);
  }
  return roots;
}

function modelIdForObject(object: Object3D): string | null {
  const { models } = $model.get();
  for (const entry of models) {
    if (entry.scene === object || entry.scene.getObjectByProperty('uuid', object.uuid)) {
      return entry.id;
    }
  }
  return null;
}

/**
 * Objects that receive a shared position delta from Settings XYZ when
 * `focus.kind === 'multi'` (independent of Edit / Move tool).
 */
export function resolveMultiSelectionPositionTargets(): PositionEditTargets {
  const empty: PositionEditTargets = {
    targets: [],
    primary: null,
    space: 'local',
    poseKind: 'selection',
  };

  const selection = $selection.get();
  const { models } = $model.get();

  if (selection.kind === 'models' && selection.modelIds.length > 1) {
    const targets: PositionEditTarget[] = [];
    for (const id of selection.modelIds) {
      const entry = models.find((model) => model.id === id);
      if (entry) {
        targets.push({ object: entry.scene, modelId: entry.id });
      }
    }
    const lastId = selection.modelIds[selection.modelIds.length - 1];
    const primary
      = targets.find((entry) => entry.modelId === lastId)?.object
        ?? targets[0]?.object
        ?? null;
    return {
      targets,
      primary,
      space: 'world',
      poseKind: 'modelRoot',
    };
  }

  if (selection.kind !== 'parts' || selection.objects.length < 2) {
    return empty;
  }

  const roots = resolveSelectionRoots(selection.objects);
  const targets: PositionEditTarget[] = [];
  for (const object of roots) {
    const modelId = modelIdForObject(object);
    if (modelId) {
      targets.push({ object, modelId });
    }
  }

  const primary
    = selection.object && targets.some((entry) => entry.object === selection.object)
      ? selection.object
      : targets[0]?.object ?? null;

  return {
    targets,
    primary,
    space: 'local',
    poseKind: 'selection',
  };
}

/**
 * Objects that receive a shared position delta from nudge.
 * Navigate → none. Move → active model root. Edit + parts → selection roots
 * (local). Model multi-select → each selected model scene (world).
 */
export function resolvePositionEditTargets(): PositionEditTargets {
  const empty: PositionEditTargets = {
    targets: [],
    primary: null,
    space: 'local',
    poseKind: 'selection',
  };

  const editTool = $editTool.get();
  if (editTool === 'navigate') {
    return empty;
  }

  const selection = $selection.get();
  const { models, activeModelId } = $model.get();

  if (selection.kind === 'models' && selection.modelIds.length > 1) {
    return resolveMultiSelectionPositionTargets();
  }

  if (editTool === 'move') {
    const entry = models.find((model) => model.id === activeModelId);
    if (!entry) {
      return empty;
    }
    return {
      targets: [{ object: entry.scene, modelId: entry.id }],
      primary: entry.scene,
      space: 'world',
      poseKind: 'modelRoot',
    };
  }

  if (selection.kind !== 'parts' || selection.objects.length === 0) {
    return empty;
  }

  const roots = resolveSelectionRoots(selection.objects);
  const targets: PositionEditTarget[] = [];
  for (const object of roots) {
    const modelId = modelIdForObject(object);
    if (modelId) {
      targets.push({ object, modelId });
    }
  }

  const primary
    = selection.object && targets.some((entry) => entry.object === selection.object)
      ? selection.object
      : targets[0]?.object ?? null;

  return {
    targets,
    primary,
    space: 'local',
    poseKind: 'selection',
  };
}
