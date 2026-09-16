import type { TimelineScrubberProps } from './types';
import { cn } from '@maxigarcia/js-utils';
import { DEFAULT_MAJOR_FRAME_STEP, DEFAULT_MIN_PX_PER_FRAME, DEFAULT_TIMELINE_FPS } from './defaults';
import { TimelineGrid } from './timeline-grid';
import { TimelinePlayhead } from './timeline-playhead';
import { TimelineRuler } from './timeline-ruler';
import { useTimelineScrubber } from './use-timeline-scrubber';

export function TimelineScrubber({
  duration,
  time,
  playing = false,
  disabled = false,
  getTime,
  onSeek,
  fps = DEFAULT_TIMELINE_FPS,
  majorFrameStep = DEFAULT_MAJOR_FRAME_STEP,
  minPxPerFrame = DEFAULT_MIN_PX_PER_FRAME,
  className,
  'aria-label': ariaLabel = 'Timeline',
}: TimelineScrubberProps) {
  const {
    scrollRef,
    trackRef,
    playheadRef,
    frameLabelRef,
    enabled,
    totalFrames,
    contentWidth,
    majorFrames,
    minorFrames,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
  } = useTimelineScrubber({
    duration,
    time,
    playing,
    disabled,
    getTime,
    onSeek,
    fps,
    majorFrameStep,
    minPxPerFrame,
  });

  return (
    <div
      ref={scrollRef}
      className={cn(
        'relative h-full overflow-x-auto overflow-y-hidden rounded-sm bg-canvas scrollbar-track-transparent',
        !enabled && 'opacity-40',
        className,
      )}
    >
      <div
        ref={trackRef}
        role="slider"
        tabIndex={enabled ? 0 : -1}
        aria-label={ariaLabel}
        aria-valuemin={1}
        aria-valuemax={totalFrames}
        aria-valuenow={1}
        aria-valuetext="Frame 1"
        aria-disabled={!enabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative h-full select-none touch-none',
          enabled ? 'cursor-ew-resize' : 'pointer-events-none',
        )}
        style={{ width: contentWidth > 0 ? contentWidth : '100%', minWidth: '100%' }}
      >
        <TimelineRuler majorFrames={majorFrames} totalFrames={totalFrames} />
        <TimelineGrid
          majorFrames={majorFrames}
          minorFrames={minorFrames}
          totalFrames={totalFrames}
        />
        <TimelinePlayhead playheadRef={playheadRef} frameLabelRef={frameLabelRef} />
      </div>
    </div>
  );
}
