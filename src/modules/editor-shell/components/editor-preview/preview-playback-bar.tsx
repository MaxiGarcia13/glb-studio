import { TimelineScrubber } from '@/components/timeline-scrubber';
import {
  PlaybackControls,
  useClipTimelineScrubber,
} from '@/modules/animation';

export function PreviewPlaybackBar() {
  const timeline = useClipTimelineScrubber();

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 border-t border-border bg-surface px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <PlaybackControls variant="icon" />
      </div>

      <TimelineScrubber
        {...timeline}
        aria-label="Animation timeline"
        className="min-h-32 flex-1"
      />
    </div>
  );
}
