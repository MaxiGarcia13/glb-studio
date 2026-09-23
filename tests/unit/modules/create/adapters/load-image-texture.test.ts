import { SRGBColorSpace, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadImageTexture,
  MAX_PART_COLOR_MAP_BYTES,
  MAX_PART_COLOR_MAP_EDGE,
} from '@/modules/create/adapters/load-image-texture';

function imageFile(
  name: string,
  options?: { bytes?: number; type?: string },
): File {
  return new File([new Uint8Array(options?.bytes ?? 8)], name, {
    type: options?.type ?? 'image/png',
  });
}

function stubCanvasDocument() {
  const context = {
    drawImage: vi.fn(),
  };
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
  return { canvas, context };
}

function stubBitmap(overrides?: {
  close?: () => void;
  height?: number;
  width?: number;
}): { close: ReturnType<typeof vi.fn> } {
  const close = vi.fn(overrides?.close);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({
      close,
      height: overrides?.height ?? 16,
      width: overrides?.width ?? 16,
    })),
  );
  return { close };
}

describe('loadImageTexture', () => {
  beforeEach(() => {
    stubCanvasDocument();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects unsupported types without decoding', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);

    await expect(loadImageTexture(imageFile('notes.txt', { type: 'text/plain' })))
      .rejects
      .toMatchObject({
        name: 'ImageTextureError',
        message: '"notes.txt" is not a supported image. Use PNG, JPEG, or WebP.',
      });
    expect(decode).not.toHaveBeenCalled();
  });

  it('accepts jpeg by extension when MIME type is empty', async () => {
    stubBitmap();
    const texture = await loadImageTexture(imageFile('photo.JPEG', { type: '' }));
    expect(texture).toBeInstanceOf(Texture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.version).toBeGreaterThan(0);
    expect(texture.flipY).toBe(true);
    expect(texture.name).toBe('photo.JPEG');
    expect(texture.image).toMatchObject({ width: 16, height: 16 });
  });

  it('uses a canvas source so Three.js can honor flipY', async () => {
    const { close } = stubBitmap();
    const texture = await loadImageTexture(imageFile('box.png'));

    expect(typeof (texture.image as HTMLCanvasElement).getContext).toBe(
      'function',
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it('decodes with EXIF orientation so pixels match browser image display', async () => {
    const decode = vi.fn(async () => ({
      close: vi.fn(),
      height: 16,
      width: 16,
    }));
    vi.stubGlobal('createImageBitmap', decode);

    await loadImageTexture(imageFile('photo.jpg', { type: 'image/jpeg' }));

    expect(decode).toHaveBeenCalledWith(
      expect.any(File),
      { imageOrientation: 'from-image' },
    );
  });

  it('falls back to a plain decode when EXIF orientation is unsupported', async () => {
    const decode = vi
      .fn()
      .mockRejectedValueOnce(new Error('bad option'))
      .mockResolvedValueOnce({
        close: vi.fn(),
        height: 16,
        width: 16,
      });
    vi.stubGlobal('createImageBitmap', decode);

    const texture = await loadImageTexture(
      imageFile('photo.jpg', { type: 'image/jpeg' }),
    );

    expect(texture).toBeInstanceOf(Texture);
    expect(decode).toHaveBeenCalledTimes(2);
    expect(decode).toHaveBeenLastCalledWith(expect.any(File));
  });

  it('rejects files over the byte cap without decoding', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);

    await expect(
      loadImageTexture(
        imageFile('huge.png', { bytes: MAX_PART_COLOR_MAP_BYTES + 1 }),
      ),
    ).rejects.toMatchObject({
      name: 'ImageTextureError',
      message: '"huge.png" is too large (max 16 MB).',
    });
    expect(decode).not.toHaveBeenCalled();
  });

  it('rejects oversized bitmaps, closes them, and keeps the previous map', async () => {
    const { close } = stubBitmap({
      height: 8,
      width: MAX_PART_COLOR_MAP_EDGE + 1,
    });
    const previous = new Texture();
    const dispose = vi.spyOn(previous, 'dispose');

    await expect(
      loadImageTexture(imageFile('wide.png'), previous),
    ).rejects.toMatchObject({
      name: 'ImageTextureError',
      message: `"wide.png" is too large (max ${MAX_PART_COLOR_MAP_EDGE} px on an edge).`,
    });
    expect(close).toHaveBeenCalled();
    expect(dispose).not.toHaveBeenCalled();
  });

  it('wraps decode failures as a user-visible error and keeps the previous map', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('corrupt');
      }),
    );
    const previous = new Texture();
    const dispose = vi.spyOn(previous, 'dispose');

    await expect(
      loadImageTexture(imageFile('broken.webp', { type: 'image/webp' }), previous),
    ).rejects.toMatchObject({
      name: 'ImageTextureError',
      message:
        'Could not decode "broken.webp". Use a PNG, JPEG, or WebP image.',
    });
    expect(dispose).not.toHaveBeenCalled();
  });

  it('disposes the previous texture only after a successful decode', async () => {
    stubBitmap();
    const previousClose = vi.fn();
    const previous = new Texture();
    previous.image = { close: previousClose };
    const dispose = vi.spyOn(previous, 'dispose');

    const texture = await loadImageTexture(imageFile('box.png'), previous);

    expect(texture).toBeInstanceOf(Texture);
    expect(dispose).toHaveBeenCalledOnce();
    expect(previousClose).toHaveBeenCalledOnce();
  });

  it('honors flipY: false for glTF / skinned UV atlases', async () => {
    stubBitmap();
    const texture = await loadImageTexture(imageFile('skin.png'), null, {
      flipY: false,
    });
    expect(texture.flipY).toBe(false);
  });
});
