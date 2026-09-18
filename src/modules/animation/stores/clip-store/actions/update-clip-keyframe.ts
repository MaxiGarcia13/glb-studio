import type { AnimationClip } from 'three';
import type { TrackInterpolationMode } from '@/modules/animation/domain/keyframe-interpolation';
import type { SaveKeyframeClipSlice } from '@/modules/animation/types/undo-stack';
import {
  deleteTrackKeyframe,
  insertTrackKeyframe,
  updateTrackKeyframe,
} from '@/modules/animation/domain/keyframe-crud';
import { setTrackInterpolation } from '@/modules/animation/domain/keyframe-interpolation';
import { snapshotSaveKeyframeClip } from '@/modules/animation/domain/undo-snapshots';
import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import { $clips } from '../store';
import { isReadyClip } from '../utils';

export interface UpdateClipKeyframeOptions {
  /** Default true. False while a key field is being edited. */
  recordUndo?: boolean;
}

export interface UpdateClipKeyframeResult {
  keyIndex: number;
}

export interface DeleteClipKeyframeResult {
  keyIndex: number;
}

export function captureKeyframeEditSnapshot(): SaveKeyframeClipSlice | null {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return null;
  }
  return snapshotSaveKeyframeClip(active);
}

function publishWorkingClip(
  clipId: string,
  working: AnimationClip,
  before: SaveKeyframeClipSlice | null,
): void {
  const state = $clips.get();
  $clips.set({
    ...state,
    clips: state.clips.map((entry) =>
      entry.id === clipId ? { ...entry, clip: working } : entry,
    ),
    duration: working.duration,
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
  });

  if (before) {
    pushUndoableCommand({
      id: 'saveKeyframe',
      clipId,
      before: { clips: [before] },
      after: { clips: [{ clipId, clip: working.clone() }] },
    });
  }
}

/**
 * Patch one key on the active ready clip’s track. Publishes a new clip clone
 * so the mixer rebinds (same pattern as `saveKeyframe`).
 */
export function updateClipKeyframe(
  trackName: string,
  keyIndex: number,
  patch: { time?: number; values?: ArrayLike<number> },
  options?: UpdateClipKeyframeOptions,
): UpdateClipKeyframeResult | null {
  const recordUndo = options?.recordUndo ?? true;
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return null;
  }

  const result = updateTrackKeyframe(active.clip, trackName, keyIndex, patch);
  if (!result) {
    return null;
  }

  const before = recordUndo ? snapshotSaveKeyframeClip(active) : null;
  publishWorkingClip(active.id, result.clip, before);
  return { keyIndex: result.keyIndex };
}

/**
 * Insert a new key on the active ready clip’s track at `time`.
 * If a key already exists at that time, nudges to the nearest free slot so Add
 * always creates a visible row. Publishes a new clip clone so the mixer rebinds.
 */
export function addClipKeyframe(
  trackName: string,
  time: number,
  values?: ArrayLike<number>,
): UpdateClipKeyframeResult | null {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return null;
  }

  const result = insertTrackKeyframe(active.clip, trackName, time, values, {
    onCollision: 'nudge',
  });
  if (!result) {
    return null;
  }

  publishWorkingClip(active.id, result.clip, snapshotSaveKeyframeClip(active));
  return { keyIndex: result.keyIndex };
}

/**
 * Delete one key on the active ready clip’s track. Publishes a new clip clone
 * so the mixer rebinds.
 */
export function deleteClipKeyframe(
  trackName: string,
  keyIndex: number,
): DeleteClipKeyframeResult | null {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return null;
  }

  const result = deleteTrackKeyframe(active.clip, trackName, keyIndex);
  if (!result) {
    return null;
  }

  publishWorkingClip(active.id, result.clip, snapshotSaveKeyframeClip(active));
  return { keyIndex: result.keyIndex };
}

/**
 * Change track interpolation when Three.js supports the mode on that track type.
 * Publishes a new clip clone so the mixer rebinds.
 */
export function setClipTrackInterpolation(
  trackName: string,
  interpolation: TrackInterpolationMode,
): boolean {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return false;
  }

  const working = setTrackInterpolation(active.clip, trackName, interpolation);
  if (!working) {
    return false;
  }

  publishWorkingClip(active.id, working, snapshotSaveKeyframeClip(active));
  return true;
}

/**
 * Record one undo entry for a key-edit gesture that already published with
 * `recordUndo: false` (trim-input pattern).
 */
export function finalizeKeyframeEdit(
  undoFrom: SaveKeyframeClipSlice | null,
): void {
  if (!undoFrom) {
    return;
  }

  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active) || active.id !== undoFrom.clipId) {
    return;
  }

  pushUndoableCommand({
    id: 'saveKeyframe',
    clipId: active.id,
    before: { clips: [undoFrom] },
    after: { clips: [{ clipId: active.id, clip: active.clip.clone() }] },
  });
}
