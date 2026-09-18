import type { PlaybackBarMode } from '@/modules/editor-shell/stores/playback-bar-mode-store';
import { useStore } from '@nanostores/react';
import { ResizableShell } from '@/components/resizable-shell';
import { Select } from '@/components/select';
import { TimelineScrubber } from '@/components/timeline-scrubber';
import {
  KeyframeTracksPane,
  PlaybackControls,
  useClipTimelineScrubber,
} from '@/modules/animation';
import {
  $playbackBarMode,
  setPlaybackBarMode,
} from '@/modules/editor-shell/stores/playback-bar-mode-store';
import { STORAGE_KEYS } from '@/utils/local-storage';

const MODE_OPTIONS: { value: PlaybackBarMode; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'tracks', label: 'Tracks' },
];

const PREVIEW_BAR_DEFAULT_HEIGHT = 224;
const PREVIEW_BAR_MIN_HEIGHT = 160;
const PREVIEW_BAR_MAX_HEIGHT = 560;

/**
 * Bottom preview chrome: shared transport + Timeline | Tracks mode.
 */
export function EditorPreviewBar() {
  const mode = useStore($playbackBarMode);
  const timeline = useClipTimelineScrubber();

  return (
    <ResizableShell
      axis="vertical"
      edge="start"
      storageKey={STORAGE_KEYS.previewBarHeight}
      defaultSize={PREVIEW_BAR_DEFAULT_HEIGHT}
      minSize={PREVIEW_BAR_MIN_HEIGHT}
      maxSize={PREVIEW_BAR_MAX_HEIGHT}
      getMaxSize={() => Math.floor(window.innerHeight * 0.75)}
      aria-label="Resize preview bar"
      className="w-full border-t border-border bg-surface"
    >
      <div className="flex h-full min-h-0 w-full flex-col gap-2 px-4 py-2">
        <div className="flex shrink-0 items-center justify-between gap-4">
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
                className="min-h-0 flex-1"
              />
            )
          : (
              <div className="min-h-0 flex-1 overflow-hidden">
                <KeyframeTracksPane />
              </div>
            )}
      </div>
    </ResizableShell>
  );
}
