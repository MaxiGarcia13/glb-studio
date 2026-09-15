import type { ModelEntry } from '@/modules/viewport/types/model';

import { Group } from 'three';
import { $model } from '@/modules/viewport/stores/model-store';

let nextCreatedModelIndex = 1;

/** Create a blank model in the library (no parts) and focus it in the preview. */
export function createEmptyModel(): void {
  const scene = new Group();
  scene.name = 'New model';

  const state = $model.get();
  const id = `model-created-${nextCreatedModelIndex++}`;
  const fileName = `New model ${state.models.length + 1}.glb`;

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
}
