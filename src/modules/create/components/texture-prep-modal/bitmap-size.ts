import type { Texture } from 'three';

export function bitmapSize(
  texture: Texture,
): { width: number; height: number } | null {
  const image = texture.image as { width?: number; height?: number } | undefined;
  if (
    image
    && typeof image.width === 'number'
    && typeof image.height === 'number'
    && image.width > 0
    && image.height > 0
  ) {
    return { width: image.width, height: image.height };
  }
  return null;
}
