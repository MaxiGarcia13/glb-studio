import { useEffect, useState } from 'react';
import { findPlayheadKeyframeIndex } from '@/modules/animation/domain/list-clip-tracks';
import { readClipTimelineTime } from '@/modules/animation/utils/to-timeline-time';

/** RAF-synced index of the key at/before the playhead (`null` if none). */
export function useKeyframePlayheadIndex(
  trackName: string,
  keyTimes: readonly number[],
): number | null {
  const keyTimesKey = keyTimes.join(',');
  const [playheadKeyIndex, setPlayheadKeyIndex] = useState<number | null>(null);

  useEffect(() => {
    const times = keyTimesKey.length === 0
      ? []
      : keyTimesKey.split(',').map(Number);

    let rafId = 0;
    const tick = () => {
      const next = findPlayheadKeyframeIndex(times, readClipTimelineTime());
      setPlayheadKeyIndex((current) => (current === next ? current : next));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [trackName, keyTimesKey]);

  return playheadKeyIndex;
}
