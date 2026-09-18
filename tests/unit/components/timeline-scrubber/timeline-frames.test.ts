import { describe, expect, it } from 'vitest';

import {
  durationToFrameCount,
  frameToTime,
  resolveMajorFrameStep,
  timeToFrame,
} from '@/components/timeline-scrubber/timeline-frames';

describe('timeToFrame', () => {
  it('rounds time to the nearest frame at the given fps', () => {
    expect(timeToFrame(1, 30)).toBe(30);
    expect(timeToFrame(0.5, 30)).toBe(15);
    expect(timeToFrame(1 / 60, 30)).toBe(1);
  });

  it('uses the default fps when omitted', () => {
    expect(timeToFrame(1)).toBe(30);
  });

  it('clamps non-finite and negative times to frame 0', () => {
    expect(timeToFrame(Number.NaN)).toBe(0);
    expect(timeToFrame(Number.POSITIVE_INFINITY)).toBe(0);
    expect(timeToFrame(-1)).toBe(0);
  });
});

describe('frameToTime', () => {
  it('converts frames to seconds', () => {
    expect(frameToTime(30, 30)).toBe(1);
    expect(frameToTime(15, 30)).toBe(0.5);
    expect(frameToTime(0, 30)).toBe(0);
  });

  it('clamps non-finite and negative frames to 0', () => {
    expect(frameToTime(Number.NaN)).toBe(0);
    expect(frameToTime(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(frameToTime(-3, 24)).toBe(0);
  });
});

describe('durationToFrameCount', () => {
  it('ceils duration into at least one frame', () => {
    expect(durationToFrameCount(1, 30)).toBe(30);
    expect(durationToFrameCount(0.01, 30)).toBe(1);
    expect(durationToFrameCount(1.01, 30)).toBe(31);
  });

  it('returns 1 for non-positive or non-finite durations', () => {
    expect(durationToFrameCount(0)).toBe(1);
    expect(durationToFrameCount(-2)).toBe(1);
    expect(durationToFrameCount(Number.NaN)).toBe(1);
  });
});

describe('resolveMajorFrameStep', () => {
  it('keeps the base step when labels fit', () => {
    expect(resolveMajorFrameStep(120, 480, 12)).toBe(12);
  });

  it('doubles until labels are readable, capping at totalFrames', () => {
    expect(resolveMajorFrameStep(120, 60, 12)).toBe(96);
    expect(resolveMajorFrameStep(10, 20, 12)).toBe(12);
  });

  it('returns the base step when totalFrames is non-positive', () => {
    expect(resolveMajorFrameStep(0, 400, 12)).toBe(12);
    expect(resolveMajorFrameStep(-1, 400, 12)).toBe(12);
  });
});
