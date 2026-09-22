import type { Texture } from 'three';
import { dataUrlFromCanvas } from '@/modules/create/adapters/load-image-texture';

/**
 * Prefer an existing thumb URL; otherwise encode a canvas-backed texture.
 * Seeded live maps often have no thumb until the user edits.
 */
export function texturePrepDisplayUrl(
  texture: Texture | null | undefined,
  thumbUrl: string | null,
): string | null {
  if (thumbUrl) {
    return thumbUrl;
  }
  if (!texture) {
    return null;
  }
  const image = texture.image as HTMLCanvasElement | undefined;
  if (image && typeof image.toDataURL === 'function') {
    return dataUrlFromCanvas(image);
  }
  return null;
}
