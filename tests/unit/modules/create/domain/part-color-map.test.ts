import { MeshStandardMaterial, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyPartColorMap,
  clearPartColorMap,
} from '@/modules/create/domain/part-color-map';
import { markTextureMapHasAlpha } from '@/modules/create/domain/texture-map-alpha';

describe('applyPartColorMap', () => {
  it('sets map and marks the material for update without changing color', () => {
    const material = new MeshStandardMaterial({ color: 0xFF0000 });
    const texture = new Texture();
    texture.name = 'box.png';
    const versionBefore = material.version;

    applyPartColorMap(material, texture);

    expect(material.map).toBe(texture);
    expect(material.version).toBeGreaterThan(versionBefore);
    expect(material.color.getHex()).toBe(0xFF0000);
    expect(material.transparent).toBe(false);
  });

  it('enables transparent cutouts when the map has alpha', () => {
    const material = new MeshStandardMaterial();
    const texture = new Texture();
    markTextureMapHasAlpha(texture, true);

    applyPartColorMap(material, texture);

    expect(material.transparent).toBe(true);
    expect(material.alphaTest).toBe(0.5);
  });
});

describe('clearPartColorMap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unsets map, marks update, and disposes the previous texture', () => {
    const material = new MeshStandardMaterial({ color: 0x00FF00 });
    const texture = new Texture();
    const close = vi.fn();
    texture.image = { close };
    const dispose = vi.spyOn(texture, 'dispose');
    material.map = texture;
    material.transparent = true;
    material.alphaTest = 0.5;
    const versionBefore = material.version;

    clearPartColorMap(material);

    expect(material.map).toBeNull();
    expect(material.version).toBeGreaterThan(versionBefore);
    expect(material.color.getHex()).toBe(0x00FF00);
    expect(material.transparent).toBe(false);
    expect(material.alphaTest).toBe(0);
    expect(dispose).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('is safe when there is no map', () => {
    const material = new MeshStandardMaterial();
    const versionBefore = material.version;
    expect(() => clearPartColorMap(material)).not.toThrow();
    expect(material.map).toBeNull();
    expect(material.version).toBeGreaterThan(versionBefore);
  });
});
