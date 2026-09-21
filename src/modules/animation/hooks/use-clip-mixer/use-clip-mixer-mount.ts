import type { RefObject } from 'react';
import type { AnimationAction, Group } from 'three';

import { useEffect } from 'react';
import { AnimationMixer } from 'three';

import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import {
  ensureRestPoseCaptured,
  syncRestPoseFromScene,
} from '@/modules/animation/domain/rest-pose';
import { $clips, syncClipsToSkeleton } from '@/modules/animation/stores/clip-store';
import {
  registerModelMixer,
  unregisterModelMixer,
} from '@/modules/animation/utils/mixer-session';

export function useClipMixerMount(
  scene: Group | null,
  modelId: string,
  mixerRef: RefObject<AnimationMixer | null>,
  actionRef: RefObject<AnimationAction | null>,
  blendActionRef: RefObject<AnimationAction | null>,
): void {
  useEffect(() => {
    if (!scene) {
      unregisterModelMixer(modelId);
      return;
    }

    ensureRestPoseCaptured(scene);
    syncClipsToSkeleton(scene);

    const mixer = new AnimationMixer(scene);
    // Initial scale only — clip switches update via setMixerTimeScale / selectClip.
    // Do not recreate this mixer when the active clip changes (useClipMixerAction).
    const clipState = $clips.get();
    const activeClipId = resolveActiveClipIdForModel(
      clipState.clips,
      modelId,
      clipState.activeClipByModelId,
      clipState.activeSharedClipId,
    );
    const active = activeClipId
      ? clipState.clips.find((entry) => entry.id === activeClipId)
      : undefined;
    mixer.timeScale = active?.timeScale ?? 1;
    mixerRef.current = mixer;
    registerModelMixer(modelId, mixer);

    return () => {
      // Eye-toggle unmount with no bound clip: bake live TRS into rest so a later
      // remount + applyRestPose (e.g. clip rebind) does not snap create parts back.
      if (!actionRef.current) {
        syncRestPoseFromScene(scene);
      }
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      mixerRef.current = null;
      actionRef.current = null;
      blendActionRef.current = null;
      unregisterModelMixer(modelId);
    };
  }, [scene, modelId, mixerRef, actionRef, blendActionRef]);
}
