import { atom } from 'nanostores';

/** Bottom preview bar body: scrubber vs keyframe Tracks pane. */
export type PlaybackBarMode = 'timeline' | 'tracks';

export const $playbackBarMode = atom<PlaybackBarMode>('timeline');

export function setPlaybackBarMode(mode: PlaybackBarMode): void {
  if ($playbackBarMode.get() === mode) {
    return;
  }
  $playbackBarMode.set(mode);
}
