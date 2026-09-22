import type { Texture } from 'three';

interface CloseableImage {
  close?: () => void;
}

/**
 * Free a color-map texture and close its ImageBitmap when present.
 * Safe to call with null / already-disposed textures.
 */
export function disposeImageTexture(texture: Texture | null | undefined): void {
  if (!texture) {
    return;
  }
  const image = texture.image as CloseableImage | undefined;
  texture.dispose();
  image?.close?.();
}
