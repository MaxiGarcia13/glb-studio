import { SRGBColorSpace, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  removeImageBackground,
  resetRemoveBackgroundLoaderForTests,
} from '@/modules/create/adapters/remove-image-background';

const removeBackgroundMock = vi.fn();

vi.mock('@imgly/background-removal', () => ({
  removeBackground: (...args: unknown[]) => removeBackgroundMock(...args),
  default: (...args: unknown[]) => removeBackgroundMock(...args),
}));

function stubCanvasDocument() {
  const context = {
    drawImage: vi.fn(),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toDataURL: vi.fn(() => 'data:image/png;base64,AAA'),
    toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(['png'], { type: 'image/png' }));
    }),
  };
  vi.stubGlobal('document', {
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return canvas;
      }
      throw new Error(`Unexpected element: ${tag}`);
    }),
  });
  return { canvas };
}

describe('removeImageBackground', () => {
  beforeEach(() => {
    stubCanvasDocument();
    resetRemoveBackgroundLoaderForTests();
    removeBackgroundMock.mockReset();
    removeBackgroundMock.mockResolvedValue(
      new Blob(['out'], { type: 'image/png' }),
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        const bitmap = {
          width: 32,
          height: 32,
          close: vi.fn(),
        };
        return bitmap;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetRemoveBackgroundLoaderForTests();
  });

  it('lazy-loads imgly, builds an alpha canvas texture, and disposes previous owned', async () => {
    const sourceCanvas = {
      width: 32,
      height: 32,
      getContext: vi.fn(),
      toDataURL: vi.fn(),
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['in'], { type: 'image/png' }));
      }),
    };
    const source = new Texture(sourceCanvas as unknown as HTMLCanvasElement);
    source.name = 'photo.jpg';
    const previous = new Texture();
    const dispose = vi.spyOn(previous, 'dispose');

    const { texture, thumbUrl } = await removeImageBackground(
      source,
      previous,
    );

    expect(removeBackgroundMock).toHaveBeenCalledOnce();
    expect(texture).toBeInstanceOf(Texture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.flipY).toBe(true);
    expect(texture.name).toBe('photo.jpg');
    expect(texture.userData.partColorMapHasAlpha).toBe(true);
    expect(dispose).toHaveBeenCalledOnce();
    expect(thumbUrl).toBe('data:image/png;base64,AAA');
  });

  it('does not dispose the seeded source when it is not previousOwned', async () => {
    const sourceCanvas = {
      width: 16,
      height: 16,
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['in'], { type: 'image/png' }));
      }),
    };
    const source = new Texture(sourceCanvas as unknown as HTMLCanvasElement);
    const dispose = vi.spyOn(source, 'dispose');

    await removeImageBackground(source, null);

    expect(dispose).not.toHaveBeenCalled();
  });

  it('surfaces a user-visible error when imgly fails', async () => {
    removeBackgroundMock.mockRejectedValue(new Error('wasm boom'));
    const sourceCanvas = {
      width: 8,
      height: 8,
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['in'], { type: 'image/png' }));
      }),
    };
    const source = new Texture(sourceCanvas as unknown as HTMLCanvasElement);

    await expect(removeImageBackground(source)).rejects.toThrow(
      /Could not remove the background/,
    );
  });
});
