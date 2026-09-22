import { Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { disposeImageTexture } from '@/utils/dispose-image-texture';

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
