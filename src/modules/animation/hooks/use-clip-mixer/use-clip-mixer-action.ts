import type { RefObject } from 'react';
import type { AnimationAction, AnimationClip, AnimationMixer, Group } from 'three';

import { useEffect } from 'react';

import { applyRestPose, applySceneRootTransform } from '@/modules/animation/domain/rest-pose';
import { $clips } from '@/modules/animation/stores/clip-store/store';
import { setActiveAction } from '@/modules/animation/utils/mixer-session';
import { toTimelineTime } from '@/modules/animation/utils/to-timeline-time';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import { $poseDirty, $poseEditKind } from '@/modules/viewport/stores/pose-edit-store';
import { syncTransformReadout } from '@/modules/viewport/stores/transform-readout-store';
import { applyLoopMode } from './apply-loop-mode';

function syncReadoutIfFocused(modelId: string, scene: Group): void {
  if ($activeModel.get()?.id === modelId) {
    syncTransformReadout(scene);
  }
}

export function useClipMixerAction(
  clip: AnimationClip | null,
  rootPosition: [number, number, number] | null,
  rootRotation: [number, number, number] | null,
  rootScale: [number, number, number] | null,
  playing: boolean,
  loop: boolean,
  modelId: string,
  mixerRef: RefObject<AnimationMixer | null>,
  actionRef: RefObject<AnimationAction | null>,
  scene: Group | null,
): void {
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) {
      return;
    }

    const previousTime = mixer.time;

    if (actionRef.current) {
      actionRef.current.stop();
      actionRef.current = null;
      setActiveAction(modelId, null);
    }

    if (!clip) {
      mixer.setTime(0);
      if (scene) {
        applyRestPose(scene);
        syncReadoutIfFocused(modelId, scene);
      }
      return;
    }

    const action = mixer.clipAction(clip);
    actionRef.current = action;
    setActiveAction(modelId, action);
    // Keep action unpaused: AnimationMixer.setTime does not advance paused actions,
    // and scrubbing uses setMixerTime. App pause is gated in useClipMixerFrame.
    action.enabled = true;
    action.paused = false;
    action.play();
    mixer.setTime(toTimelineTime(previousTime, clip.duration, $clips.get().loop));
  }, [clip, scene, modelId, mixerRef, actionRef]);

  useEffect(() => {
    if (!clip || !scene) {
      return;
    }
    // Don't clobber an in-progress Move / Settings XYZ edit.
    if ($poseDirty.get() && $poseEditKind.get() === 'modelRoot') {
      return;
    }
    applySceneRootTransform(scene, rootPosition, rootRotation, rootScale);
    syncReadoutIfFocused(modelId, scene);
  }, [clip, rootPosition, rootRotation, rootScale, scene, modelId]);

  useEffect(() => {
    const action = actionRef.current;
    const mixer = mixerRef.current;
    if (!action || !mixer) {
      return;
    }

    applyLoopMode(action, loop);
    action.paused = false;
    action.play();

    if (!playing) {
      return;
    }

    const duration = action.getClip().duration;
    if (duration > 0 && mixer.time >= duration) {
      action.reset();
      mixer.setTime(0);
    } else if (mixer.time <= 1e-6) {
      action.reset();
    }
  }, [playing, loop, clip, scene, modelId, mixerRef, actionRef]);
}
