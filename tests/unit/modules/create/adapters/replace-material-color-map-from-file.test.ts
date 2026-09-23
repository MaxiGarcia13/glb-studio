import { MeshStandardMaterial, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadSkinnedColorMapFromFile,
  replaceMaterialColorMapFromFile,
} from '@/modules/create/adapters/replace-material-color-map-from-file';

function imageFile(name: string): File {
  return new File([new Uint8Array(8)], name, { type: 'image/png' });
}

function stubCanvasDocument() {
  const context = { drawImage: vi.fn() };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toDataURL: vi.fn(() => 'data:image/png;base64,AAA'),
  };
  vi.stubGlobal('document', {
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return canvas;
      }
      throw new Error(`Unexpected element: ${tag}`);
    }),
  });
}

describe('loadSkinnedColorMapFromFile', () => {
  beforeEach(() => {
    stubCanvasDocument();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        close: vi.fn(),
        height: 16,
        width: 16,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('decodes with flipY false without assigning', async () => {
    const texture = await loadSkinnedColorMapFromFile(imageFile('skin.png'));
    expect(texture.flipY).toBe(false);
    expect(texture.name).toBe('skin.png');
  });

  it('throws without side effects when decode fails', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('corrupt');
      }),
    );
    await expect(
      loadSkinnedColorMapFromFile(imageFile('broken.png')),
    ).rejects.toMatchObject({ name: 'ImageTextureError' });
  });
});

describe('replaceMaterialColorMapFromFile', () => {
  beforeEach(() => {
    stubCanvasDocument();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        close: vi.fn(),
        height: 16,
        width: 16,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('assigns the decoded map and disposes the previous map', async () => {
    const material = new MeshStandardMaterial({ color: 0xABCDEF });
    const previous = new Texture();
    const close = vi.fn();
    previous.image = { close };
    const dispose = vi.spyOn(previous, 'dispose');
    material.map = previous;

    const texture = await replaceMaterialColorMapFromFile(
      material,
      imageFile('skin.png'),
    );

    expect(material.map).toBe(texture);
    expect(material.color.getHex()).toBe(0xABCDEF);
    expect(texture.flipY).toBe(false);
    expect(dispose).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('leaves the live map when decode fails', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('corrupt');
      }),
    );
    const material = new MeshStandardMaterial();
    const previous = new Texture();
    const dispose = vi.spyOn(previous, 'dispose');
    material.map = previous;

    await expect(
      replaceMaterialColorMapFromFile(material, imageFile('broken.png')),
    ).rejects.toMatchObject({ name: 'ImageTextureError' });

    expect(material.map).toBe(previous);
    expect(dispose).not.toHaveBeenCalled();
  });
});
