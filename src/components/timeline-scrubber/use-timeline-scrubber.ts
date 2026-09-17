import type { TimelineScrubberProps } from './types';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  DEFAULT_MAJOR_FRAME_STEP,
  DEFAULT_MIN_PX_PER_FRAME,
  DEFAULT_TIMELINE_FPS,
} from './defaults';
import {
  durationToFrameCount,
  frameToTime,
  resolveMajorFrameStep,
  timeToFrame,
} from './timeline-frames';
import { buildFrameMarks, clamp01 } from './utils';

type UseTimelineScrubberOptions = Pick<
  TimelineScrubberProps,
  | 'duration'
  | 'time'
  | 'playing'
  | 'disabled'
  | 'getTime'
  | 'onSeek'
  | 'fps'
  | 'majorFrameStep'
  | 'minPxPerFrame'
>;

export function useTimelineScrubber({
  duration,
  time,
  playing = false,
  disabled = false,
  getTime,
  onSeek,
  fps = DEFAULT_TIMELINE_FPS,
  majorFrameStep = DEFAULT_MAJOR_FRAME_STEP,
  minPxPerFrame = DEFAULT_MIN_PX_PER_FRAME,
}: UseTimelineScrubberOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const frameLabelRef = useRef<HTMLSpanElement>(null);
  const draggingRef = useRef(false);
  const onSeekRef = useRef(onSeek);
  const getTimeRef = useRef(getTime);

  onSeekRef.current = onSeek;
  getTimeRef.current = getTime;

  const [trackWidth, setTrackWidth] = useState(0);

  const enabled = !disabled && duration > 0;
  const totalFrames = durationToFrameCount(duration, fps);
  const contentWidth = Math.max(trackWidth, totalFrames * minPxPerFrame);
  const majorStep = resolveMajorFrameStep(totalFrames, contentWidth, majorFrameStep);
  const minorStep = Math.max(1, Math.floor(majorStep / 4));
  const { majorFrames, minorFrames } = buildFrameMarks(totalFrames, majorStep, minorStep);

  const readTime = () => {
    const reader = getTimeRef.current;
    if (reader) {
      return reader();
    }
    return time;
  };

  const applyPlayhead = (nextTime: number) => {
    const frame = Math.max(1, timeToFrame(nextTime, fps));
    const ratio = duration > 0 ? clamp01(nextTime / duration) : 0;
    if (playheadRef.current) {
      playheadRef.current.style.left = `${ratio * 100}%`;
    }
    if (frameLabelRef.current) {
      frameLabelRef.current.textContent = String(frame);
    }
    const track = trackRef.current;
    if (track) {
      track.setAttribute('aria-valuenow', String(frame));
      track.setAttribute('aria-valuetext', `Frame ${frame}`);
    }
  };

  const seekFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track || !enabled) {
      return;
    }
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const ratio = clamp01((clientX - rect.left) / rect.width);
    const nextTime = ratio * duration;
    onSeekRef.current(nextTime);
    applyPlayhead(nextTime);
  };

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setTrackWidth(width);
    });
    observer.observe(scroll);
    return () => observer.disconnect();
  }, []);

  // Layout: position before paint so pause/re-render never flashes the playhead to 0.
  // Prefer getTime() via readTime() — React `time` is not updated while playing.
  useLayoutEffect(() => {
    if (draggingRef.current) {
      return;
    }
    if (playing) {
      return;
    }
    applyPlayhead(readTime());
  }, [playing, time, duration, fps]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    let rafId = 0;
    const tick = () => {
      if (!draggingRef.current) {
        applyPlayhead(readTime());
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [playing, duration, fps]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) {
      return;
    }
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }
    seekFromClientX(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enabled) {
      return;
    }
    const frame = timeToFrame(readTime(), fps);
    let nextFrame = frame;
    if (event.key === 'ArrowLeft') {
      nextFrame = Math.max(0, frame - 1);
    } else if (event.key === 'ArrowRight') {
      nextFrame = Math.min(totalFrames, frame + 1);
    } else if (event.key === 'Home') {
      nextFrame = 0;
    } else if (event.key === 'End') {
      nextFrame = totalFrames;
    } else {
      return;
    }
    event.preventDefault();
    const nextTime = Math.min(frameToTime(nextFrame, fps), duration);
    onSeekRef.current(nextTime);
    applyPlayhead(nextTime);
  };

  return {
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
  };
}
