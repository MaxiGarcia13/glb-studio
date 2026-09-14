import type { Object3D } from 'three';

import type { ClipEntry } from '@/modules/animation/types/clip';
import { setMixerTime, setMixerTimeScale } from '@/modules/animation/utils/mixer-session';
import { $clips } from '../store';
import { nextClipId, toNewAnimationEntry } from '../utils';

function nextDraftName(existing: ClipEntry[]): string {
  const used = new Set(existing.map((entry) => entry.name));
  let n = existing.length + 1;

  while (used.has(`New animation ${n}`)) {
    n += 1;
  }

  return `New animation ${n}`;
}

/** Create a new editable animation from scratch and select it. */
export function startNewAnimation(
  scene: Object3D | null,
  ownerModelId: string | null = null,
): string | null {
  if (!scene) {
    return null;
  }

  const state = $clips.get();
  const id = nextClipId();
  const name = nextDraftName(state.clips);
  const entry = toNewAnimationEntry(id, name, ownerModelId);
  const duration = entry.clip?.duration ?? 0;

  $clips.set({
    ...state,
    clips: [...state.clips, entry],
    activeClipId: entry.id,
    activeSharedClipId: null,
    activeClipByModelId: ownerModelId
      ? { ...state.activeClipByModelId, [ownerModelId]: entry.id }
      : state.activeClipByModelId,
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
    playing: false,
    duration,
    trimStart: 0,
    trimEnd: duration,
  });
  setMixerTime(0);
  setMixerTimeScale(entry.timeScale);

  return entry.id;
}
