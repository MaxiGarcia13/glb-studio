import { SRGBColorSpace, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { transformImageTexture } from '@/modules/create/adapters/transform-image-texture';

function stubCanvasDocument() {
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
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

function fakeSourceImage(width: number, height: number) {
  return { width, height };
}

describe('transformImageTexture', () => {
  beforeEach(() => {
    stubCanvasDocument();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds a new canvas-backed texture from crop + flip and disposes previous owned', async () => {
    const source = new Texture(fakeSourceImage(100, 80));
    source.name = 'logo.png';
    const previous = new Texture();
    const dispose = vi.spyOn(previous, 'dispose');

    const { texture, thumbUrl } = await transformImageTexture(
      source,
      {
        flipX: true,
        crop: { sx: 10, sy: 10, sw: 50, sh: 50 },
      },
      previous,
    );

    expect(texture).toBeInstanceOf(Texture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.flipY).toBe(true);
    expect(texture.name).toBe('logo.png');
    expect(typeof (texture.image as HTMLCanvasElement).getContext).toBe(
      'function',
    );
    expect(dispose).toHaveBeenCalledOnce();
    expect(thumbUrl).toBe('data:image/png;base64,AAA');
  });

  it('does not dispose the source when it is not the owned previous', async () => {
    const source = new Texture(fakeSourceImage(16, 16));
    const dispose = vi.spyOn(source, 'dispose');

    await transformImageTexture(source, { flipY: true }, null);

    expect(dispose).not.toHaveBeenCalled();
  });

  it('rejects crop regions outside the image', async () => {
    const source = new Texture(fakeSourceImage(32, 32));
    await expect(
      transformImageTexture(
        source,
        { crop: { sx: 0, sy: 0, sw: 64, sh: 64 } },
        null,
      ),
    ).rejects.toMatchObject({
      name: 'ImageTextureError',
      message: 'Crop region is outside the image.',
    });
  });
});
