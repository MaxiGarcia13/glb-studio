import { useStore } from '@nanostores/react';
import { $model } from '@/modules/viewport/stores/model-store';
import { $clips, pause, play, stop, toggleLoop } from '../stores/clip-store';

export interface PlaybackTransport {
  playing: boolean;
  loop: boolean;
  /** True when an active clip exists and at least one model is previewed. */
  enabled: boolean;
  play: typeof play;
  pause: typeof pause;
  stop: typeof stop;
  toggleLoop: typeof toggleLoop;
}

/** Shared play / pause / stop / loop state for Timeline and Tracks bar modes. */
export function usePlaybackTransport(): PlaybackTransport {
  const { playing, loop, activeClipId } = useStore($clips, {
    keys: ['playing', 'loop', 'activeClipId'],
  });
  const { previewModelIds } = useStore($model, { keys: ['previewModelIds'] });

  // Clip selection drives play; model focus is not required (US-20 play is global).
  const enabled = activeClipId !== null && previewModelIds.length > 0;

  return {
    playing,
    loop,
    enabled,
    play,
    pause,
    stop,
    toggleLoop,
  };
}
