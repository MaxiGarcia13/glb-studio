import { setMixerTimeScale } from '@/modules/animation/utils/mixer-session';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';
import { $clips } from '../store';
import { restorePose } from './restore-pose';

/** Clear the active clip (T-pose / bind pose). Mixer effect restores rest TRS. */
export function clearActiveClip(): void {
  const state = $clips.get();
  if (state.activeClipId === null && !state.activeSharedClipId && !state.playing) {
    return;
  }

  if ($poseDirty.get()) {
    restorePose();
  }

  setMixerTimeScale(1);
  $clips.set({
    ...$clips.get(),
    activeClipId: null,
    activeSharedClipId: null,
    activeClipByModelId: {},
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
    playing: false,
    duration: 0,
    trimStart: 0,
    trimEnd: 0,
  });
}
