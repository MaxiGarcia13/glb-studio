import { MeshStandardMaterial, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyPartColorMap,
  clearPartColorMap,
} from '@/modules/create/domain/part-color-map';

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
    const versionBefore = material.version;

    clearPartColorMap(material);

    expect(material.map).toBeNull();
    expect(material.version).toBeGreaterThan(versionBefore);
    expect(material.color.getHex()).toBe(0x00FF00);
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
