import { describe, expect, it } from 'vitest';
import {
  centerSquareCrop,
  isAlreadySquare,
} from '@/modules/create/domain/texture-crop';

describe('centerSquareCrop', () => {
  it('returns the full image when already square', () => {
    expect(centerSquareCrop(512, 512)).toEqual({
      sx: 0,
      sy: 0,
      sw: 512,
      sh: 512,
    });
  });

  it('center-crops a wide image', () => {
    expect(centerSquareCrop(1000, 400)).toEqual({
      sx: 300,
      sy: 0,
      sw: 400,
      sh: 400,
    });
  });

  it('center-crops a tall image', () => {
    expect(centerSquareCrop(200, 500)).toEqual({
      sx: 0,
      sy: 150,
      sw: 200,
      sh: 200,
    });
  });
});

describe('isAlreadySquare', () => {
  it('detects square dimensions', () => {
    expect(isAlreadySquare(64, 64)).toBe(true);
    expect(isAlreadySquare(64, 32)).toBe(false);
    expect(isAlreadySquare(0, 0)).toBe(false);
  });
});
