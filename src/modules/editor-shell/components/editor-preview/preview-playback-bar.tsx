import { TimelineScrubber } from '@/components/timeline-scrubber';
import {
  PlaybackControls,
  useClipTimelineScrubber,
} from '@/modules/animation';

export function PreviewPlaybackBar() {
  const timeline = useClipTimelineScrubber();

  return (
    <div className="shrink-0 border-t border-border bg-surface px-4 py-2 w-full flex flex-col gap-2 items-between justify-center">
      <PlaybackControls className="flex items-center justify-center" />

      <TimelineScrubber
        {...timeline}
        aria-label="Animation timeline"
        className="min-h-32 flex-1"
      />
    </div>
  );
}
