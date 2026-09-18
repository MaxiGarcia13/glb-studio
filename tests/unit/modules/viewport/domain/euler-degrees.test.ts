import { describe, expect, it } from 'vitest';

import {
  degreesToRadians,
  radiansToDegrees,
  wrapDegrees,
} from '@/modules/viewport/domain/euler-degrees';

describe('wrapDegrees', () => {
  it('leaves values already in [0, 360) unchanged', () => {
    expect(wrapDegrees(0)).toBe(0);
    expect(wrapDegrees(90)).toBe(90);
    expect(wrapDegrees(359.5)).toBe(359.5);
  });

  it('wraps above 360 and negative angles into [0, 360)', () => {
    expect(wrapDegrees(360)).toBe(0);
    expect(wrapDegrees(450)).toBe(90);
    expect(wrapDegrees(-90)).toBe(270);
    expect(wrapDegrees(-360)).toBe(0);
    expect(wrapDegrees(-450)).toBe(270);
  });
});

describe('radiansToDegrees', () => {
  it('converts common angles and wraps the result', () => {
    expect(radiansToDegrees(0)).toBe(0);
    expect(radiansToDegrees(Math.PI / 2)).toBe(90);
    expect(radiansToDegrees(Math.PI)).toBe(180);
    expect(radiansToDegrees(-Math.PI / 2)).toBe(270);
    expect(radiansToDegrees(3 * Math.PI)).toBe(180);
  });
});

describe('degreesToRadians', () => {
  it('converts wrapped degrees to radians', () => {
    expect(degreesToRadians(0)).toBe(0);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(450)).toBeCloseTo(Math.PI / 2);
    expect(degreesToRadians(-90)).toBeCloseTo((270 * Math.PI) / 180);
  });

  it('round-trips with radiansToDegrees for angles in range', () => {
    for (const degrees of [0, 45, 90, 180, 270, 359]) {
      expect(radiansToDegrees(degreesToRadians(degrees))).toBeCloseTo(degrees);
    }
  });
});
