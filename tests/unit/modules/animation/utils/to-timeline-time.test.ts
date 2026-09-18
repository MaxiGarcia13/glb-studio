import { describe, expect, it } from 'vitest';

import { toTimelineTime } from '@/modules/animation/utils/to-timeline-time';

describe('toTimelineTime', () => {
  it('returns 0 for non-finite, negative, or empty-duration inputs', () => {
    expect(toTimelineTime(Number.NaN, 2, true)).toBe(0);
    expect(toTimelineTime(Number.POSITIVE_INFINITY, 2, false)).toBe(0);
    expect(toTimelineTime(-0.1, 2, true)).toBe(0);
    expect(toTimelineTime(1, 0, true)).toBe(0);
    expect(toTimelineTime(1, -1, false)).toBe(0);
  });

  it('wraps within the clip when looping', () => {
    expect(toTimelineTime(0, 2, true)).toBe(0);
    expect(toTimelineTime(1.5, 2, true)).toBe(1.5);
    expect(toTimelineTime(2, 2, true)).toBe(0);
    expect(toTimelineTime(5.25, 2, true)).toBe(1.25);
  });

  it('clamps to duration when not looping (pause at end)', () => {
    expect(toTimelineTime(0, 2, false)).toBe(0);
    expect(toTimelineTime(1.5, 2, false)).toBe(1.5);
    expect(toTimelineTime(2, 2, false)).toBe(2);
    expect(toTimelineTime(9, 2, false)).toBe(2);
  });
});
