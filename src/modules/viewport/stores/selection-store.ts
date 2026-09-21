import type { Object3D } from 'three';

import type { SelectionState } from '../types/selection';
import { map } from 'nanostores';
import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import { resumeMixerBindings } from '@/modules/animation/utils/mixer-session';
import { EMPTY_SELECTION } from '../types/selection';
import { $poseDirty, clearPoseDirty } from './pose-edit-store';

export const $selection = map<SelectionState>({ ...EMPTY_SELECTION });

function flushOpenPoseEdit(): void {
  commitPendingPose();
  resumeMixerBindings();
  clearPoseDirty();
}

function sameSolePart(state: SelectionState, object: Object3D): boolean {
  return (
    state.kind === 'parts'
    && state.object === object
    && state.objects.length === 1
    && state.objects[0] === object
  );
}

function sameModelIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((id, index) => id === b[index]);
}

/**
 * Plain click: replace selection with a single part/bone/mesh.
 * Clears any model multi-selection.
 */
export function selectObject(object: Object3D | null): void {
  if (object === null) {
    clearSelection();
    return;
  }

  const prev = $selection.get();
  if (sameSolePart(prev, object)) {
    return;
  }

  if (prev.object !== object) {
    flushOpenPoseEdit();
  }

  $selection.set({
    object,
    objects: [object],
    modelIds: [],
    kind: 'parts',
  });
}

/**
 * Plain click: replace selection with these model ids (order preserved; last = active).
 * Clears any part selection.
 */
export function selectModelIds(modelIds: readonly string[]): void {
  const unique: string[] = [];
  for (const id of modelIds) {
    if (!unique.includes(id)) {
      unique.push(id);
    }
  }

  const prev = $selection.get();
  if (prev.kind === 'models' && sameModelIds(prev.modelIds, unique)) {
    return;
  }

  if (prev.object !== null || $poseDirty.get()) {
    flushOpenPoseEdit();
  }

  if (unique.length === 0) {
    $selection.set({ ...EMPTY_SELECTION });
    return;
  }

  $selection.set({
    object: null,
    objects: [],
    modelIds: unique,
    kind: 'models',
  });
}

/**
 * Replace one selected part with another (e.g. drill-in from create-group → mesh).
 * If `from` is not selected, falls back to selecting `to`. Active becomes `to`.
 */
export function replaceObjectInSelection(from: Object3D, to: Object3D): void {
  if (from === to) {
    return;
  }

  const prev = $selection.get();
  if (prev.kind !== 'parts' || !prev.objects.includes(from)) {
    selectObject(to);
    return;
  }

  const withoutFrom = prev.objects.filter((entry) => entry !== from);
  const nextObjects = withoutFrom.includes(to) ? withoutFrom : [...withoutFrom, to];

  if (prev.object !== to) {
    flushOpenPoseEdit();
  }

  $selection.set({
    object: to,
    objects: nextObjects,
    modelIds: [],
    kind: 'parts',
  });
}

/**
 * Shift+click parts: toggle membership. Switching from models starts a parts selection.
 * Active becomes the toggled-on object, or the last remaining when deselecting active.
 */
export function toggleObject(object: Object3D): void {
  const prev = $selection.get();

  if (prev.kind !== 'parts') {
    selectObject(object);
    return;
  }

  const index = prev.objects.indexOf(object);
  if (index >= 0) {
    const nextObjects = prev.objects.filter((entry) => entry !== object);
    if (nextObjects.length === 0) {
      clearSelection();
      return;
    }

    const nextActive
      = prev.object === object
        ? nextObjects[nextObjects.length - 1]!
        : prev.object!;

    if (nextActive !== prev.object) {
      flushOpenPoseEdit();
    }

    $selection.set({
      object: nextActive,
      objects: nextObjects,
      modelIds: [],
      kind: 'parts',
    });
    return;
  }

  if (object !== prev.object) {
    flushOpenPoseEdit();
  }

  $selection.set({
    object,
    objects: [...prev.objects, object],
    modelIds: [],
    kind: 'parts',
  });
}

/**
 * Shift+click models: toggle membership. Switching from parts clears parts first.
 * Appended id becomes the active (last) anchor.
 */
export function toggleModelId(modelId: string): void {
  const prev = $selection.get();

  if (prev.kind !== 'models') {
    if (prev.object !== null || $poseDirty.get()) {
      flushOpenPoseEdit();
    }
    $selection.set({
      object: null,
      objects: [],
      modelIds: [modelId],
      kind: 'models',
    });
    return;
  }

  if (prev.modelIds.includes(modelId)) {
    const nextIds = prev.modelIds.filter((id) => id !== modelId);
    if (nextIds.length === 0) {
      $selection.set({ ...EMPTY_SELECTION });
      return;
    }
    $selection.set({
      object: null,
      objects: [],
      modelIds: nextIds,
      kind: 'models',
    });
    return;
  }

  $selection.set({
    object: null,
    objects: [],
    modelIds: [...prev.modelIds, modelId],
    kind: 'models',
  });
}

export function clearSelection(): void {
  const prev = $selection.get();
  if (prev.kind === 'none' && !$poseDirty.get()) {
    return;
  }

  if (prev.object !== null || $poseDirty.get()) {
    flushOpenPoseEdit();
  }

  $selection.set({ ...EMPTY_SELECTION });
}

export function isObjectInSelection(object: Object3D): boolean {
  return $selection.get().objects.includes(object);
}

export function isModelInSelection(modelId: string): boolean {
  return $selection.get().modelIds.includes(modelId);
}

/** Group/Ungroup anchor for model multi-select — last clicked id. */
export function getActiveSelectedModelId(): string | null {
  const { kind, modelIds } = $selection.get();
  if (kind !== 'models' || modelIds.length === 0) {
    return null;
  }
  return modelIds[modelIds.length - 1] ?? null;
}
