import { describe, expect, it } from 'vitest';

import {
  buildRulerTicks,
  formatRulerLabel,
} from '@/modules/viewport/utils/axis-ruler';

describe('buildRulerTicks', () => {
  it('builds ascending minor ticks and marks major multiples', () => {
    expect(buildRulerTicks(2, 1, 0.5)).toEqual([
      { value: 0.5, major: false },
      { value: 1, major: true },
      { value: 1.5, major: false },
      { value: 2, major: true },
    ]);
  });

  it('stops at size and skips the origin', () => {
    expect(buildRulerTicks(1, 1, 1)).toEqual([{ value: 1, major: true }]);
    expect(buildRulerTicks(0.75, 1, 0.5)).toEqual([
      { value: 0.5, major: false },
    ]);
  });
});

describe('formatRulerLabel', () => {
  it('formats major ticks as whole metres and minors to two decimals', () => {
    expect(formatRulerLabel({ value: 2, major: true })).toBe('2m');
    expect(formatRulerLabel({ value: 0.5, major: false })).toBe('0.50');
    expect(formatRulerLabel({ value: 1.25, major: false })).toBe('1.25');
  });
});
