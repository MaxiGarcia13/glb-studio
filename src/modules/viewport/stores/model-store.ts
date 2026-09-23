import type { ModelEntry, ModelLibraryPhase, ModelLibraryState, ModelLoadResult } from '../types/model';

import { computed, map } from 'nanostores';
import {
  clearAllBindPoseOverrides,
  clearBindPoseOverrides,
} from '@/modules/animation/stores/bind-pose-store';
import {
  importClipsFromAnimations,
  removeClipsByOwner,
} from '@/modules/animation/stores/clip-store';
import {
  disposeAllSessionSkins,
  disposeSessionSkinsForModel,
} from '@/modules/create/stores/session-skins-store';
import { preserveGltfExtension } from '@/utils/glb-parse';
import { loadModelFromFile } from '../adapters/model-loader';
import { disposeScene } from '../utils/scene-dispose';
import { removeModelsFromGroups } from './model-group-store';
import { clearSelection } from './selection-store';

export const $model = map<ModelLibraryState>({
  models: [],
  previewModelIds: [],
  activeModelId: null,
  phase: 'idle',
  error: null,
});

export const $activeModel = computed($model, (state) => {
  const { models, activeModelId } = state;
  return models.find((model) => model.id === activeModelId) ?? null;
});

let nextModelId = 1;

function createEntryId(): string {
  return `model-${nextModelId++}`;
}

/**
 * Commit already-parsed model results (used by the content router).
 * Returns the newly added library entries (empty when nothing loaded).
 */
export function importModelResults(
  results: ModelLoadResult[],
  failures: string[] = [],
): ModelEntry[] {
  $model.setKey('phase', 'loading');
  $model.setKey('error', null);

  const loadedEntries: ModelEntry[] = [];

  for (const result of results) {
    const entry: ModelEntry = {
      id: createEntryId(),
      fileName: result.fileName,
      scene: result.scene,
      source: result.source,
      ...(result.blobUrl ? { blobUrl: result.blobUrl } : {}),
    };
    loadedEntries.push(entry);
    importClipsFromAnimations(
      result.animations,
      result.scene,
      result.fileName,
      entry.id,
    );
  }

  const current = $model.get();
  const failureText = failures.length > 0 ? failures.join('\n') : null;

  if (loadedEntries.length === 0) {
    const phase = current.models.length > 0 ? 'loaded' : 'error';
    $model.set({
      ...current,
      phase,
      error: failureText,
    });
    return [];
  }

  $model.set({
    models: [...current.models, ...loadedEntries],
    previewModelIds: [
      ...current.previewModelIds,
      ...loadedEntries.map((entry) => entry.id),
    ],
    activeModelId: loadedEntries.at(-1)?.id ?? current.activeModelId,
    phase: 'loaded',
    error: failureText,
  });

  return loadedEntries;
}

export function focusModel(
  modelId: string,
  options?: { preserveSelection?: boolean },
): void {
  const state = $model.get();
  if (!state.previewModelIds.includes(modelId)) {
    return;
  }
  if (state.activeModelId === modelId) {
    return;
  }
  // Clear here (not in a React effect) so callers can re-select synchronously after.
  // Shift+click multi-select passes preserveSelection to avoid wiping the set.
  if (!options?.preserveSelection) {
    clearSelection();
  }
  $model.setKey('activeModelId', modelId);
}

/**
 * Focus a model from the library; shows it in the viewport if it was hidden.
 * Clicking the already-focused model clears focus (same pattern as clip rows).
 */
export function selectModel(modelId: string): void {
  const state = $model.get();
  if (!state.models.some((model) => model.id === modelId)) {
    return;
  }

  const previewModelIds = state.previewModelIds.includes(modelId)
    ? state.previewModelIds
    : [...state.previewModelIds, modelId];

  if (state.activeModelId === modelId) {
    clearSelection();
    $model.set({ ...state, previewModelIds, activeModelId: null });
    return;
  }

  clearSelection();
  $model.set({ ...state, previewModelIds, activeModelId: modelId });
}

export function toggleModelPreview(modelId: string): void {
  const state = $model.get();
  if (!state.models.some((model) => model.id === modelId)) {
    return;
  }

  const previewSet = new Set(state.previewModelIds);
  if (previewSet.has(modelId)) {
    previewSet.delete(modelId);
  } else {
    previewSet.add(modelId);
  }

  const previewModelIds = [...previewSet];
  let { activeModelId } = state;

  if (previewSet.has(modelId)) {
    activeModelId = modelId;
  } else if (activeModelId === modelId) {
    activeModelId = previewModelIds.at(-1) ?? null;
  }

  if (activeModelId !== state.activeModelId) {
    clearSelection();
  }

  $model.set({ ...state, previewModelIds, activeModelId });
}

export function renameModel(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const state = $model.get();
  const index = state.models.findIndex((model) => model.id === id);
  if (index < 0) {
    return;
  }
  const models = [...state.models];
  const previous = models[index];
  const fileName = preserveGltfExtension(trimmed, previous.fileName);
  if (fileName === previous.fileName) {
    return;
  }
  models[index] = { ...previous, fileName };
  $model.setKey('models', models);
}

function disposeEntry(entry: ModelEntry): void {
  if (entry.blobUrl) {
    URL.revokeObjectURL(entry.blobUrl);
  }
  disposeScene(entry.scene);
}

export function removeModel(id: string): void {
  const state = $model.get();
  const index = state.models.findIndex((model) => model.id === id);
  if (index < 0) {
    return;
  }

  const removed = state.models[index];
  disposeSessionSkinsForModel(id, removed.scene);
  disposeEntry(removed);
  clearBindPoseOverrides(id);
  removeClipsByOwner(id);
  removeModelsFromGroups([id]);

  const models = state.models.filter((model) => model.id !== id);
  const previewModelIds = state.previewModelIds.filter((previewId) => previewId !== id);
  let activeModelId = state.activeModelId;
  if (activeModelId === id) {
    activeModelId = previewModelIds.at(-1) ?? null;
  }
  const phase: ModelLibraryPhase = models.length > 0 ? 'loaded' : 'idle';

  $model.set({
    models,
    previewModelIds,
    activeModelId,
    phase,
    error: null,
  });

  if (models.length === 0) {
    clearAllBindPoseOverrides();
    disposeAllSessionSkins();
  }
}

export async function replaceModel(id: string, file: File): Promise<void> {
  const initialIndex = $model.get().models.findIndex((model) => model.id === id);
  if (initialIndex < 0) {
    return;
  }

  try {
    const result = await loadModelFromFile(file);
    const state = $model.get();
    const currentIndex = state.models.findIndex((model) => model.id === id);
    if (currentIndex < 0) {
      if (result.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
      disposeScene(result.scene);
      return;
    }

    const previous = state.models[currentIndex];
    disposeSessionSkinsForModel(id, previous.scene);
    disposeEntry(previous);
    clearBindPoseOverrides(id);

    const models = [...state.models];
    models[currentIndex] = {
      ...previous,
      fileName: result.fileName,
      blobUrl: result.blobUrl,
      scene: result.scene,
      source: result.source,
    };

    $model.set({
      ...state,
      models,
      phase: 'loaded',
      error: null,
    });

    importClipsFromAnimations(
      result.animations,
      result.scene,
      result.fileName,
      id,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to replace model';
    $model.setKey('error', message);
  }
}
