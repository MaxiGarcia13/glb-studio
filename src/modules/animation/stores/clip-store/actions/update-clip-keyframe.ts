import type { SaveKeyframeClipSlice } from '@/modules/animation/types/undo-stack';
import { updateTrackKeyframe } from '@/modules/animation/domain/keyframe-write';
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

export function captureKeyframeEditSnapshot(): SaveKeyframeClipSlice | null {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return null;
  }
  return snapshotSaveKeyframeClip(active);
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
  $clips.set({
    ...state,
    clips: state.clips.map((entry) =>
      entry.id === active.id ? { ...entry, clip: result.clip } : entry,
    ),
    duration: result.clip.duration,
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
  });

  if (recordUndo && before) {
    pushUndoableCommand({
      id: 'saveKeyframe',
      clipId: active.id,
      before: { clips: [before] },
      after: { clips: [{ clipId: active.id, clip: result.clip.clone() }] },
    });
  }

  return { keyIndex: result.keyIndex };
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
