import { MeshStandardMaterial, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import {
  markTextureMapHasAlpha,
  syncMaterialMapAlpha,
  textureMapHasAlpha,
} from '@/modules/create/domain/color-map/texture-map-alpha';

describe('textureMapHasAlpha', () => {
  it('respects the userdata flag without sampling', () => {
    const texture = new Texture();
    expect(textureMapHasAlpha(texture)).toBe(false);

    markTextureMapHasAlpha(texture, true);
    expect(textureMapHasAlpha(texture)).toBe(true);

    markTextureMapHasAlpha(texture, false);
    expect(textureMapHasAlpha(texture)).toBe(false);
  });
});

describe('syncMaterialMapAlpha', () => {
  it('enables transparent cutouts when the map is flagged with alpha', () => {
    const material = new MeshStandardMaterial();
    const texture = new Texture();
    markTextureMapHasAlpha(texture, true);

    syncMaterialMapAlpha(material, texture);

    expect(material.transparent).toBe(true);
    expect(material.alphaTest).toBe(0.5);
  });

  it('clears cutout mode when the map is removed', () => {
    const material = new MeshStandardMaterial({
      transparent: true,
      alphaTest: 0.5,
    });

    syncMaterialMapAlpha(material, null);

    expect(material.transparent).toBe(false);
    expect(material.alphaTest).toBe(0);
  });
});
