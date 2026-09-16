import type { Group } from 'three';
import type { ModelEntry } from '@/modules/viewport/types/model';
import { $model } from '@/modules/viewport/stores/model-store';

let nextCreatedModelIndex = 1;

/**
 * Register a created-model scene in the library, join preview, and focus it.
 * Shared by empty New model and From kit.
 */
export function addCreatedModelToLibrary(scene: Group, fileName: string): string {
  const state = $model.get();
  const id = `model-created-${nextCreatedModelIndex++}`;

  const entry: ModelEntry = {
    id,
    fileName,
    scene,
    source: 'created',
  };

  $model.set({
    models: [...state.models, entry],
    previewModelIds: [...state.previewModelIds, id],
    activeModelId: id,
    phase: 'loaded',
    error: null,
  });

  return id;
}

export function nextCreatedModelFileName(label: string): string {
  const count = $model.get().models.length + 1;
  return `${label} ${count}.glb`;
}
