import type { AnimationClip } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import { setMixerTime, setMixerTimeScale } from '@/modules/animation/utils/mixer-session';
import { $clips } from '../store';
import { isReadyClip } from '../utils';
import { clearActiveClip } from './clear-active-clip';

function applySharedSelection(target: ClipEntry & { clip: AnimationClip }): void {
  setMixerTime(0);
  setMixerTimeScale(target.timeScale);
  $clips.set({
    ...$clips.get(),
    activeClipId: target.id,
    activeSharedClipId: target.id,
    activeClipByModelId: {},
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
    playing: false,
    duration: target.clip.duration,
    trimStart: 0,
    trimEnd: target.clip.duration,
  });
}

/**
 * Library list selection (same pattern as models). A shared clip sets
 * `activeSharedClipId` and clears per-model owned selections; playback may still
 * use a same-name ready owned clip per model (`resolveActiveClipIdForModel`).
 * An owned clip selects only the owning model and clears shared selection.
 */
export function selectClip(id: string, modelId?: string): void {
  if (!id) {
    clearActiveClip();
    return;
  }

  const target = $clips.get().clips.find((entry) => entry.id === id);
  if (!isReadyClip(target)) {
    return;
  }

  const state = $clips.get();
  const isShared = target.ownerModelId === null;

  if (isShared) {
    if (state.activeSharedClipId === id) {
      clearActiveClip();
      return;
    }
    applySharedSelection(target);
    return;
  }

  const ownerModelId = modelId ?? target.ownerModelId;
  if (!ownerModelId) {
    return;
  }

  if (state.activeClipByModelId[ownerModelId] === id) {
    $clips.set({
      ...$clips.get(),
      activeClipId: state.activeSharedClipId,
      activeClipByModelId: {
        ...state.activeClipByModelId,
        [ownerModelId]: null,
      },
      blendBaseClip: null,
      blendClipId: null,
      blendWeight: 0,
      playing: false,
      duration: 0,
      trimStart: 0,
      trimEnd: 0,
    });
    return;
  }

  setMixerTime(0);
  setMixerTimeScale(target.timeScale);
  $clips.set({
    ...$clips.get(),
    activeClipId: id,
    activeSharedClipId: null,
    activeClipByModelId: {
      ...state.activeClipByModelId,
      [ownerModelId]: id,
    },
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
    playing: false,
    duration: target.clip.duration,
    trimStart: 0,
    trimEnd: target.clip.duration,
  });
}
