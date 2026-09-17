import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import {
  getMixerTime,
  resumeMixerBindings,
  setMixerTime,
  setMixerTimeScale,
} from '@/modules/animation/utils/mixer-session';
import { $poseDirty, clearPoseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { $clips } from '../store';
import { isReadyClip } from '../utils';
import { commitPendingPose } from './commit-pending-pose';

export const MIN_TIME_SCALE = 0.1;
export const MAX_TIME_SCALE = 3;

export interface SetTimeScaleOptions {
  /** Default true. False while the speed slider is dragging. */
  recordUndo?: boolean;
  /** Gesture baseline; when set, the stack entry uses this as `before`. */
  undoFrom?: number;
}

export function setTimeScale(scale: number, options?: SetTimeScaleOptions): void {
  const recordUndo = options?.recordUndo ?? true;
  const clamped = Math.min(Math.max(scale, MIN_TIME_SCALE), MAX_TIME_SCALE);
  const state = $clips.get();
  const activeClipId = state.activeClipId;
  if (!activeClipId) {
    return;
  }

  const entry = state.clips.find((clip) => clip.id === activeClipId);
  if (!entry) {
    return;
  }

  const previous = entry.timeScale;
  if (previous !== clamped) {
    const clips = state.clips.map((clip) =>
      clip.id === activeClipId ? { ...clip, timeScale: clamped } : clip,
    );
    $clips.setKey('clips', clips);
    setMixerTimeScale(clamped);
  }

  const beforeScale = options?.undoFrom ?? previous;
  if (recordUndo && beforeScale !== clamped) {
    pushUndoableCommand({
      id: 'setTimeScale',
      clipId: activeClipId,
      before: { timeScale: beforeScale },
      after: { timeScale: clamped },
    });
  }
}

export function play(): void {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return;
  }
  if (!state.loop && state.duration > 0 && getMixerTime() >= state.duration) {
    setMixerTime(0);
  } else if ($poseDirty.get()) {
    commitPendingPose();
  } else {
    resumeMixerBindings();
    clearPoseDirty();
  }
  $clips.setKey('playing', true);
}

export function pause(): void {
  $clips.setKey('playing', false);
}

export function stop(): void {
  setMixerTime(0);
  $clips.setKey('playing', false);
}

export function toggleLoop(): void {
  $clips.setKey('loop', !$clips.get().loop);
}
