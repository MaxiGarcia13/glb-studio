import type { Texture } from 'three';

import {
  canvasFromDrawable,
  ImageTextureError,
} from '@/modules/create/adapters/load-image-texture';

function sourceImageSize(
  image: { width?: number; height?: number },
): { width: number; height: number } {
  const width = image.width;
  const height = image.height;
  if (
    typeof width !== 'number'
    || typeof height !== 'number'
    || width <= 0
    || height <= 0
  ) {
    throw new ImageTextureError('Could not encode skin image.');
  }
  return { width, height };
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new ImageTextureError('Could not encode skin image.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * Encode a Three.js texture image as PNG bytes for zip sidecars (US-49).
 * Supports canvas-backed maps and ImageBitmap / HTMLImageElement sources.
 */
export async function pngArrayBufferFromTexture(
  texture: Texture,
): Promise<ArrayBuffer> {
  const image = texture.image as
    | HTMLCanvasElement
    | ImageBitmap
    | HTMLImageElement
    | { width?: number; height?: number }
    | undefined;

  if (!image) {
    throw new ImageTextureError('Could not encode skin image.');
  }

  if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) {
    const blob = await blobFromCanvas(image);
    return blob.arrayBuffer();
  }

  const { width, height } = sourceImageSize(image);
  const canvas = canvasFromDrawable(
    image as CanvasImageSource,
    width,
    height,
  );
  const blob = await blobFromCanvas(canvas);
  return blob.arrayBuffer();
}
