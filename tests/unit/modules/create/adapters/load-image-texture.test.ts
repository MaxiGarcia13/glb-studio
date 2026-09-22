import { SRGBColorSpace, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  disposeImageTexture,
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
});

describe('disposeImageTexture', () => {
  it('disposes the GPU texture and closes an ImageBitmap', () => {
    const close = vi.fn();
    const texture = new Texture();
    texture.image = { close };
    const dispose = vi.spyOn(texture, 'dispose');

    disposeImageTexture(texture);

    expect(dispose).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('is a no-op for null', () => {
    expect(() => disposeImageTexture(null)).not.toThrow();
  });
});
