import type { Object3D } from 'three';

import type { ClipEntry } from '@/modules/animation/types/clip';

import { buildSkeletonNodeSet, validateClipAgainstSkeleton } from '@/modules/animation/domain/clip-validate';
import { setMixerTimeScale } from '@/modules/animation/utils/mixer-session';
import { $model } from '@/modules/viewport/stores/model-store';
import { $clips } from '../store';
import { isReadyClip } from '../utils';

/**
 * Re-validate every clip after a model change.
 * - Owned clips validate against their owner's skeleton.
 * - Shared clips validate against the active model (skeleton param).
 */
export function syncClipsToSkeleton(skeleton: Object3D | null): void {
  const state = $clips.get();
  if (!skeleton) {
    setMixerTimeScale(1);
    $clips.set({
      ...state,
      activeClipId: null,
      activeSharedClipId: null,
      activeClipByModelId: {},
      blendBaseClip: null,
      blendClipId: null,
      blendWeight: 0,
      playing: false,
      duration: 0,
    });
    return;
  }

  const models = $model.get().models;
  const ownerScenes = new Map<string, Object3D>();
  for (const model of models) {
    ownerScenes.set(model.id, model.scene);
  }

  const clips = state.clips.map((entry): ClipEntry => {
    if (!entry.clip) {
      return entry;
    }

    // Shared clips: per-model fit is checked in the library UI — do not flip global
    // status when each model's mixer mounts with a different skeleton.
    if (entry.ownerModelId === null) {
      return entry;
    }

    const ownerScene = ownerScenes.get(entry.ownerModelId);
    if (!ownerScene) {
      return entry;
    }

    const nodeNames = buildSkeletonNodeSet(ownerScene);
    const validation = validateClipAgainstSkeleton(entry.clip, nodeNames);
    if (!validation.valid) {
      return {
        ...entry,
        status: 'error',
        error: validation.error,
      };
    }
    // Keep draft write-targets as draft; other valid clips stay/become ready.
    return {
      ...entry,
      status: entry.status === 'draft' ? 'draft' : 'ready',
      error: null,
    };
  });

  // Keep an explicit T-pose (null) — do not auto-pick the first ready clip.
  const activeEntry
    = state.activeClipId
      ? clips.find((entry) => entry.id === state.activeClipId) ?? null
      : null;
  const activeClipId
    = activeEntry && isReadyClip(activeEntry)
      ? state.activeClipId
      : null;

  // Revalidate shared selection.
  const sharedEntry = state.activeSharedClipId
    ? clips.find((entry) => entry.id === state.activeSharedClipId)
    : null;
  const activeSharedClipId
    = sharedEntry && isReadyClip(sharedEntry)
      ? state.activeSharedClipId
      : null;

  // Revalidate per-model selections.
  const activeClipByModelId: Record<string, string | null> = {};
  for (const [modelId, clipId] of Object.entries(state.activeClipByModelId)) {
    if (!clipId) {
      activeClipByModelId[modelId] = null;
      continue;
    }
    const entry = clips.find((e) => e.id === clipId);
    activeClipByModelId[modelId] = entry && isReadyClip(entry) ? clipId : null;
  }

  const blendClipId
    = state.blendClipId && isReadyClip(clips.find((entry) => entry.id === state.blendClipId))
      ? state.blendClipId
      : null;

  const active = activeClipId ? clips.find((entry) => entry.id === activeClipId) : null;
  const duration = active?.clip?.duration ?? 0;

  setMixerTimeScale(active?.timeScale ?? 1);
  $clips.set({
    clips,
    activeClipId,
    activeSharedClipId,
    activeClipByModelId,
    blendBaseClip: blendClipId ? state.blendBaseClip : null,
    blendClipId,
    blendWeight: blendClipId ? state.blendWeight : 0,
    playing: false,
    loop: state.loop,
    duration,
    trimStart: 0,
    trimEnd: duration,
  });
}
