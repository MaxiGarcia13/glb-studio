import type { ModelEntry } from '@/modules/viewport/types/model';

import { clearBindPoseOverrides } from '@/modules/animation/stores/bind-pose-store';
import { removeClipsByOwner } from '@/modules/animation/stores/clip-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { clearSelection } from '@/modules/viewport/stores/selection-store';
import { disposeScene } from '@/modules/viewport/utils/scene-dispose';

import { canSkinModel } from '../domain/skinning/can-skin-model';
import { convertCreatedSceneToSkinned } from '../domain/skinning/convert-created-scene-to-skinned';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';

export interface SkinCreatedModelResult {
  ok: boolean;
  error?: string;
}

/**
 * Skin a created library model in place: clone → convert → swap on success.
 * On failure the original scene is left unchanged and `error` is set on `$model`.
 */
export function skinCreatedModel(modelId: string): SkinCreatedModelResult {
  const state = $model.get();
  const index = state.models.findIndex((model) => model.id === modelId);
  if (index < 0) {
    const error = 'Model not found';
    $model.setKey('error', error);
    return { ok: false, error };
  }

  const entry = state.models[index]!;
  const availability = canSkinModel(entry);
  if (!availability.enabled) {
    $model.setKey('error', availability.reason);
    return { ok: false, error: availability.reason };
  }

  const snapshot = entry.scene.clone(true);
  let skinnedScene: ReturnType<typeof convertCreatedSceneToSkinned> | null = null;

  try {
    skinnedScene = convertCreatedSceneToSkinned(snapshot);

    const latest = $model.get();
    const currentIndex = latest.models.findIndex((model) => model.id === modelId);
    if (currentIndex < 0) {
      disposeScene(skinnedScene);
      disposeScene(snapshot);
      const error = 'Model not found';
      $model.setKey('error', error);
      return { ok: false, error };
    }

    const previous = latest.models[currentIndex]!;
    const nextEntry: ModelEntry = {
      ...previous,
      scene: skinnedScene,
      source: 'imported',
    };

    const models = [...latest.models];
    models[currentIndex] = nextEntry;

    clearSelection();
    clearBindPoseOverrides(modelId);
    removeClipsByOwner(modelId);

    $model.set({
      ...latest,
      models,
      phase: 'loaded',
      error: null,
    });

    disposeScene(previous.scene);
    disposeScene(snapshot);
    bumpCreatePartsRevision();

    return { ok: true };
  }
  catch (error) {
    disposeScene(snapshot);
    if (skinnedScene) {
      disposeScene(skinnedScene);
    }
    const message = error instanceof Error ? error.message : 'Failed to skin model';
    $model.setKey('error', message);
    return { ok: false, error: message };
  }
}
