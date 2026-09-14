import type { ClipLibraryState } from '@/modules/animation/types/clip';
import { $clips } from '../store';
import { isReadyClip } from '../utils';
import { selectClip } from './select-clip';

/** Remove every clip owned by the given model. */
export function removeClipsByOwner(ownerId: string): void {
  const state = $clips.get();
  const clips = state.clips.filter((entry) => entry.ownerModelId !== ownerId);
  if (clips.length === state.clips.length) {
    return;
  }

  const activeOwned = state.activeClipId
    ? state.clips.find((e) => e.id === state.activeClipId)?.ownerModelId === ownerId
    : false;
  const blendOwned = state.blendClipId
    ? state.clips.find((e) => e.id === state.blendClipId)?.ownerModelId === ownerId
    : false;

  const base: ClipLibraryState = {
    ...state,
    clips,
    activeClipByModelId: { ...state.activeClipByModelId, [ownerId]: null },
    blendBaseClip: blendOwned ? null : state.blendBaseClip,
    blendClipId: blendOwned ? null : state.blendClipId,
    blendWeight: blendOwned ? 0 : state.blendWeight,
  };

  if (!activeOwned) {
    $clips.set(base);
    return;
  }

  const nextReady = clips.find((entry) => isReadyClip(entry));
  $clips.set({
    ...base,
    activeClipId: null,
    playing: false,
    duration: 0,
  });

  if (nextReady) {
    selectClip(nextReady.id);
  }
}
