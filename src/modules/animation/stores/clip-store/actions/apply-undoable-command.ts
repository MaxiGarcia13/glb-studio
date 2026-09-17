import type { ClipEntry } from '@/modules/animation/types/clip';
import type {
  SaveKeyframeClipSlice,
  SaveKeyframeSnapshot,
  TrimClipSnapshot,
  UndoableCommand,
} from '@/modules/animation/types/undo-stack';

import {
  cloneBindPoseOverrides,
  cloneVec3Map,
} from '@/modules/animation/domain/undo-snapshots';
import { replaceBindPoseOverrides } from '@/modules/animation/stores/bind-pose-store';
import {
  setMixerTime,
  setMixerTimeScale,
} from '@/modules/animation/utils/mixer-session';
import { $clips } from '../store';

function applyTrimClipSnapshot(clipId: string, snapshot: TrimClipSnapshot): void {
  const state = $clips.get();
  if (!state.clips.some((entry) => entry.id === clipId)) {
    return;
  }

  const clip = snapshot.clip.clone();
  const isActive = state.activeClipId === clipId;
  $clips.set({
    ...state,
    clips: state.clips.map((entry) =>
      entry.id === clipId ? { ...entry, clip } : entry,
    ),
    ...(isActive
      ? {
          duration: snapshot.duration,
          playing: false,
          trimEnd: snapshot.trimEnd,
          trimStart: snapshot.trimStart,
        }
      : {}),
  });

  if (isActive) {
    setMixerTime(0);
  }
}

function applyTimeScaleSnapshot(clipId: string, timeScale: number): void {
  const state = $clips.get();
  if (!state.clips.some((entry) => entry.id === clipId)) {
    return;
  }

  $clips.setKey(
    'clips',
    state.clips.map((entry) =>
      entry.id === clipId ? { ...entry, timeScale } : entry,
    ),
  );

  if (state.activeClipId === clipId) {
    setMixerTimeScale(timeScale);
  }
}

function applySaveKeyframeSlice(
  entry: ClipEntry,
  slice: SaveKeyframeClipSlice,
): ClipEntry {
  return {
    ...entry,
    ...(slice.clip ? { clip: slice.clip.clone() } : {}),
    ...('sourceClip' in slice
      ? { sourceClip: slice.sourceClip?.clone() ?? null }
      : {}),
    ...(slice.rootPositionByModelId
      ? { rootPositionByModelId: cloneVec3Map(slice.rootPositionByModelId) }
      : {}),
    ...(slice.rootRotationByModelId
      ? { rootRotationByModelId: cloneVec3Map(slice.rootRotationByModelId) }
      : {}),
    ...(slice.rootScaleByModelId
      ? { rootScaleByModelId: cloneVec3Map(slice.rootScaleByModelId) }
      : {}),
  };
}

function applySaveKeyframeSnapshot(snapshot: SaveKeyframeSnapshot): void {
  const state = $clips.get();
  const byId = new Map(snapshot.clips.map((slice) => [slice.clipId, slice]));
  const clips = state.clips.map((entry) => {
    const slice = byId.get(entry.id);
    return slice ? applySaveKeyframeSlice(entry, slice) : entry;
  });

  const active = state.activeClipId
    ? clips.find((entry) => entry.id === state.activeClipId)
    : undefined;
  const restoredActiveClip = Boolean(
    state.activeClipId
    && snapshot.clips.some((slice) => slice.clipId === state.activeClipId && slice.clip),
  );
  const duration = restoredActiveClip && active?.clip
    ? active.clip.duration
    : state.duration;

  $clips.set({
    ...state,
    clips,
    duration,
    ...(restoredActiveClip
      ? {
          blendBaseClip: null,
          blendClipId: null,
          blendWeight: 0,
        }
      : {}),
  });

  if (snapshot.bindPoseOverrides) {
    replaceBindPoseOverrides(cloneBindPoseOverrides(snapshot.bindPoseOverrides));
  }
}

/** Replace library fields from a stack snapshot. Mixer clip rebind is a follow-up. */
export function applyUndoableCommand(
  command: UndoableCommand,
  direction: 'undo' | 'redo',
): void {
  switch (command.id) {
    case 'trimClip': {
      const snapshot = direction === 'undo' ? command.before : command.after;
      applyTrimClipSnapshot(command.clipId, snapshot);
      return;
    }
    case 'saveKeyframe': {
      const snapshot = direction === 'undo' ? command.before : command.after;
      applySaveKeyframeSnapshot(snapshot);
      return;
    }
    case 'setTimeScale': {
      const snapshot = direction === 'undo' ? command.before : command.after;
      applyTimeScaleSnapshot(command.clipId, snapshot.timeScale);
    }
  }
}
