import type { PlaybackBarMode } from '@/modules/editor-shell/stores/playback-bar-mode-store';
import { useStore } from '@nanostores/react';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { TimelineScrubber } from '@/components/timeline-scrubber';
import {
  PlaybackControls,
  useClipTimelineScrubber,
} from '@/modules/animation';
import {
  $playbackBarMode,

  setPlaybackBarMode,
} from '@/modules/editor-shell/stores/playback-bar-mode-store';

const MODE_OPTIONS: { value: PlaybackBarMode; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'tracks', label: 'Tracks' },
];

/**
 * Bottom preview chrome: shared transport + Timeline | Tracks mode.
 * Tracks pane body lands in a follow-up US-9 task.
 */
export function PreviewPlaybackBar() {
  const mode = useStore($playbackBarMode);
  const timeline = useClipTimelineScrubber();

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 border-t border-border bg-surface px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <PlaybackControls variant="icon" />
        <Select
          aria-label="Playback bar mode"
          value={mode}
          options={MODE_OPTIONS}
          className="w-32 shrink-0"
          onChange={(event) => {
            setPlaybackBarMode(event.target.value as PlaybackBarMode);
          }}
        />
      </div>

      {mode === 'timeline'
        ? (
            <TimelineScrubber
              {...timeline}
              aria-label="Animation timeline"
              className="min-h-32 flex-1"
            />
          )
        : (
            <div className="flex min-h-32 items-center justify-center">
              <Text as="p" variant="muted">
                Tracks editor opens here.
              </Text>
            </div>
          )}
    </div>
  );
}
