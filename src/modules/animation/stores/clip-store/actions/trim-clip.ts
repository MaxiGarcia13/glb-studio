import type { TrimClipSnapshot } from '@/modules/animation/types/undo-stack';

import { trimClipWindow } from '@/modules/animation/domain/clip-trim';
import { snapshotTrimClip } from '@/modules/animation/domain/undo-snapshots';
import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import { setMixerTime } from '@/modules/animation/utils/mixer-session';
import { $clips } from '../store';
import { isReadyClip } from '../utils';

export interface TrimClipOptions {
  /** Default true. False while a trim field is being edited. */
  recordUndo?: boolean;
  /** Gesture baseline; when set, the stack entry uses this as `before`. */
  undoFrom?: TrimClipSnapshot;
}

export function captureTrimClipSnapshot(): TrimClipSnapshot | null {
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return null;
  }
  return snapshotTrimClip(
    active.clip,
    state.trimStart,
    state.trimEnd,
    state.duration,
  );
}

export function trimClip(
  start: number,
  end: number,
  options?: TrimClipOptions,
): void {
  const recordUndo = options?.recordUndo ?? true;
  const state = $clips.get();
  const active = state.clips.find((entry) => entry.id === state.activeClipId);
  if (!isReadyClip(active)) {
    return;
  }

  const source = active.sourceClip ?? active.clip;
  const sourceDuration = source.duration;
  const clampedStart = Math.min(Math.max(start, 0), sourceDuration);
  const clampedEnd = Math.min(Math.max(end, 0), sourceDuration);
  if (clampedEnd <= clampedStart) {
    return;
  }

  const nextDuration = clampedEnd - clampedStart;
  const alreadyApplied
    = state.trimStart === clampedStart
      && state.trimEnd === clampedEnd
      && state.duration === nextDuration;

  const before = options?.undoFrom ?? snapshotTrimClip(
    active.clip,
    state.trimStart,
    state.trimEnd,
    state.duration,
  );

  let afterClip = active.clip;
  if (!alreadyApplied) {
    const working = trimClipWindow(source, clampedStart, clampedEnd);
    afterClip = working;
    $clips.set({
      ...state,
      clips: state.clips.map((entry) =>
        entry.id === active.id ? { ...entry, clip: working } : entry,
      ),
      playing: false,
      duration: nextDuration,
      trimStart: clampedStart,
      trimEnd: clampedEnd,
    });
    setMixerTime(0);
  }

  const after = snapshotTrimClip(afterClip, clampedStart, clampedEnd, nextDuration);
  const windowChanged
    = before.trimStart !== after.trimStart
      || before.trimEnd !== after.trimEnd
      || before.duration !== after.duration;

  if (recordUndo && windowChanged) {
    pushUndoableCommand({
      id: 'trimClip',
      clipId: active.id,
      before,
      after,
    });
  }
}
