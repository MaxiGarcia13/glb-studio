import { describe, expect, it } from 'vitest';
import {
  centerSquareCrop,
  clampImageCropRect,
  cropRectFromCorners,
  fullImageCrop,
  isAlreadySquare,
  isFullImageCrop,
} from '@/modules/create/domain/color-map/texture-crop';

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

describe('clampImageCropRect', () => {
  it('keeps a valid rect inside the image', () => {
    expect(
      clampImageCropRect({ sx: 10, sy: 20, sw: 30, sh: 40 }, 100, 80),
    ).toEqual({ sx: 10, sy: 20, sw: 30, sh: 40 });
  });

  it('pulls overflow back into bounds', () => {
    expect(
      clampImageCropRect({ sx: 90, sy: 70, sw: 40, sh: 30 }, 100, 80),
    ).toEqual({ sx: 60, sy: 50, sw: 40, sh: 30 });
  });
});

describe('cropRectFromCorners', () => {
  it('normalizes drag direction', () => {
    expect(cropRectFromCorners(80, 60, 20, 10, 100, 80)).toEqual({
      sx: 20,
      sy: 10,
      sw: 60,
      sh: 50,
    });
  });
});

describe('fullImageCrop / isFullImageCrop', () => {
  it('describes the whole image', () => {
    const full = fullImageCrop(64, 32);
    expect(full).toEqual({ sx: 0, sy: 0, sw: 64, sh: 32 });
    expect(isFullImageCrop(full, 64, 32)).toBe(true);
    expect(
      isFullImageCrop({ sx: 0, sy: 0, sw: 32, sh: 32 }, 64, 32),
    ).toBe(false);
  });
});
