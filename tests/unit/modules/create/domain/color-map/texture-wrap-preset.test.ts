import { ClampToEdgeWrapping, RepeatWrapping, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import {
  applyTextureWrapPreset,
  inferTextureWrapPreset,
  TEXTURE_WRAP_PRESETS,
} from '@/modules/create/domain/color-map/texture-wrap-preset';

describe('tEXTURE_WRAP_PRESETS', () => {
  it('exposes Clamp, Tile 2×, and Tile 4×', () => {
    expect(TEXTURE_WRAP_PRESETS.map((preset) => preset.id)).toEqual([
      'clamp',
      'tile-2',
      'tile-4',
    ]);
  });
});

describe('applyTextureWrapPreset', () => {
  it('sets clamp-to-edge with 1×1 repeat', () => {
    const texture = new Texture();
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);

    applyTextureWrapPreset(texture, 'clamp');

    expect(texture.wrapS).toBe(ClampToEdgeWrapping);
    expect(texture.wrapT).toBe(ClampToEdgeWrapping);
    expect(texture.repeat.x).toBe(1);
    expect(texture.repeat.y).toBe(1);
  });

  it('sets repeat wrapping for Tile 2× and Tile 4×', () => {
    const texture = new Texture();

    applyTextureWrapPreset(texture, 'tile-2');
    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
    expect(texture.repeat.x).toBe(2);
    expect(texture.repeat.y).toBe(2);

    applyTextureWrapPreset(texture, 'tile-4');
    expect(texture.repeat.x).toBe(4);
    expect(texture.repeat.y).toBe(4);
  });
});

describe('inferTextureWrapPreset', () => {
  it('recognizes clamp and tile presets from texture state', () => {
    const texture = new Texture();
    expect(inferTextureWrapPreset(texture)).toBe('clamp');

    applyTextureWrapPreset(texture, 'tile-2');
    expect(inferTextureWrapPreset(texture)).toBe('tile-2');

    applyTextureWrapPreset(texture, 'tile-4');
    expect(inferTextureWrapPreset(texture)).toBe('tile-4');
  });
});
