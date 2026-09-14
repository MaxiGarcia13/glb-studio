import type { AnimationAction, AnimationMixer } from 'three';

import { clearPoseDirty } from '@/modules/viewport/stores/pose-edit-store';

interface ModelMixerSession {
  mixer: AnimationMixer;
  action: AnimationAction | null;
  blendAction: AnimationAction | null;
}

const sessions = new Map<string, ModelMixerSession>();
let activeModelId: string | null = null;
let blendWeight = 0;

function activeSession(): ModelMixerSession | null {
  if (activeModelId === null) {
    return null;
  }
  return sessions.get(activeModelId) ?? null;
}

/**
 * Transport targets the focused model when one is set; otherwise every
 * registered (previewed) mixer so Play / Stop / scrub still work with a clip
 * selected and no model focused.
 */
function transportSessions(): ModelMixerSession[] {
  const focused = activeSession();
  if (focused) {
    return [focused];
  }
  return [...sessions.values()];
}

function applyBlendWeights(session: ModelMixerSession | null): void {
  if (!session) {
    return;
  }
  session.action?.setEffectiveWeight(1 - blendWeight);
  session.blendAction?.setEffectiveWeight(blendWeight);
}

/** Transport / pose-edit controls target the mixer of this model. */
export function setActiveModelMixer(modelId: string | null): void {
  activeModelId = modelId;
  applyBlendWeights(activeSession());
}

export function registerModelMixer(modelId: string, mixer: AnimationMixer): void {
  const session = sessions.get(modelId);
  if (session) {
    session.mixer = mixer;
    session.action = null;
    session.blendAction = null;
  } else {
    sessions.set(modelId, { mixer, action: null, blendAction: null });
  }
}

export function unregisterModelMixer(modelId: string): void {
  sessions.delete(modelId);
  if (activeModelId === modelId) {
    activeModelId = null;
  }
}

export function setActiveAction(modelId: string, action: AnimationAction | null): void {
  const session = sessions.get(modelId);
  if (!session) {
    return;
  }
  session.action = action;
  if (modelId === activeModelId) {
    applyBlendWeights(session);
  }
}

export function setBlendAction(modelId: string, action: AnimationAction | null): void {
  const session = sessions.get(modelId);
  if (!session) {
    return;
  }
  session.blendAction = action;
  if (modelId === activeModelId) {
    applyBlendWeights(session);
  }
}

/** Blend weight given to the secondary action; the primary gets 1 - weight. */
export function setBlendWeight(weight: number): void {
  blendWeight = Math.min(Math.max(weight, 0), 1);
  applyBlendWeights(activeSession());
}

export function getBlendWeight(): number {
  return blendWeight;
}

/** Stop the active model's clip bindings from overwriting a manual pose edit. */
export function suspendMixerBindings(): void {
  for (const session of transportSessions()) {
    session.action && (session.action.enabled = false);
    session.blendAction && (session.blendAction.enabled = false);
  }
}

export function resumeMixerBindings(): void {
  for (const session of transportSessions()) {
    session.action && (session.action.enabled = true);
    session.blendAction && (session.blendAction.enabled = true);
  }
}

export function getMixerTime(): number {
  const [session] = transportSessions();
  return session?.mixer.time ?? 0;
}

export function setMixerTime(time: number): void {
  resumeMixerBindings();
  for (const session of transportSessions()) {
    session.mixer.setTime(time);
  }
  clearPoseDirty();
}

/**
 * Sample the active clip at `time` without clearing a dirty pose edit.
 * Temporarily enables bindings, writes the pose, then disables them again so a
 * pending model-root edit is not overwritten on the next frame.
 */
export function sampleMixerAt(time: number): void {
  const session = activeSession();
  if (!session?.action) {
    return;
  }

  session.action.enabled = true;
  if (session.blendAction) {
    session.blendAction.enabled = true;
  }
  applyBlendWeights(session);
  session.mixer.setTime(time);
  session.action.enabled = false;
  if (session.blendAction) {
    session.blendAction.enabled = false;
  }
}

/**
 * Discard unsaved gizmo edits and re-apply the active clip(s) at the playhead.
 *
 * Plain setTime(t) is not enough: Three's PropertyMixer skips writing when the
 * resampled clip values match the previous accumulation (same playhead), so the
 * preview keeps the edited bone/mesh TRS. stop()+play() re-snapshots bindings
 * from the current scene, then setTime writes the clip pose back.
 */
export function restoreMixerPose(): void {
  resumeMixerBindings();
  for (const session of transportSessions()) {
    if (!session.action) {
      continue;
    }
    const time = session.mixer.time;
    session.action.stop();
    session.action.play();
    if (session.blendAction) {
      session.blendAction.stop();
      session.blendAction.play();
    }
    if (session === activeSession()) {
      applyBlendWeights(session);
    }
    session.mixer.setTime(time);
  }
  clearPoseDirty();
}

export function setMixerTimeScale(scale: number): void {
  for (const session of transportSessions()) {
    session.mixer.timeScale = scale;
  }
}
