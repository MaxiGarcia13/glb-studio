import type { Texture } from 'three';

import { markTextureMapHasAlpha } from '@/modules/create/domain/texture-map-alpha';
import { disposeImageTexture } from '@/utils/dispose-image-texture';
import {
  canvasFromDrawable,
  colorMapTextureFromCanvas,
  dataUrlFromCanvas,
  ImageTextureError,
} from './load-image-texture';

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
    throw new ImageTextureError('Could not remove the background.');
  }
  return { width, height };
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new ImageTextureError('Could not remove the background.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

async function blobFromTextureImage(
  image: CanvasImageSource & { width?: number; height?: number },
): Promise<Blob> {
  if (typeof HTMLCanvasElement !== 'undefined'
    && image instanceof HTMLCanvasElement) {
    return blobFromCanvas(image);
  }
  const { width, height } = sourceImageSize(image);
  const canvas = canvasFromDrawable(image, width, height);
  return blobFromCanvas(canvas);
}

type RemoveBackgroundFn = (
  image: Blob,
  configuration?: { output?: { format?: string; quality?: number } },
) => Promise<Blob>;

let removeBackgroundPromise: Promise<RemoveBackgroundFn> | null = null;

/** Lazy-load `@imgly/background-removal` (WASM + ONNX) on first use. */
function loadRemoveBackground(): Promise<RemoveBackgroundFn> {
  if (!removeBackgroundPromise) {
    removeBackgroundPromise = import('@imgly/background-removal').then(
      (mod) => {
        const fn = mod.removeBackground ?? mod.default;
        if (typeof fn !== 'function') {
          throw new ImageTextureError(
            'Background removal is unavailable in this browser.',
          );
        }
        return fn as RemoveBackgroundFn;
      },
    ).catch(() => {
      removeBackgroundPromise = null;
      throw new ImageTextureError(
        'Could not load background removal. Check your connection and try again.',
      );
    });
  }
  return removeBackgroundPromise;
}

/** Test seam — reset the cached dynamic import between unit tests. */
export function resetRemoveBackgroundLoaderForTests(): void {
  removeBackgroundPromise = null;
}

/**
 * Opt-in client-side background removal → PNG-with-alpha draft texture.
 * Disposes `previousOwned` only after success (never the seeded live map when
 * it is distinct from `previousOwned`).
 */
export async function removeImageBackground(
  source: Texture,
  previousOwned?: Texture | null,
): Promise<{ texture: Texture; thumbUrl: string | null }> {
  const image = source.image as CanvasImageSource & {
    width?: number;
    height?: number;
  };
  if (!image) {
    throw new ImageTextureError('Could not remove the background.');
  }

  const inputBlob = await blobFromTextureImage(image);
  const removeBackground = await loadRemoveBackground();

  let resultBlob: Blob;
  try {
    resultBlob = await removeBackground(inputBlob, {
      output: { format: 'image/png', quality: 1 },
    });
  } catch (cause) {
    if (cause instanceof ImageTextureError) {
      throw cause;
    }
    throw new ImageTextureError(
      'Could not remove the background. Try a clearer subject or a smaller image.',
    );
  }

  if (typeof createImageBitmap !== 'function') {
    throw new ImageTextureError('Could not remove the background.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(resultBlob);
  } catch {
    throw new ImageTextureError('Could not remove the background.');
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = canvasFromDrawable(bitmap, bitmap.width, bitmap.height);
  } catch (error) {
    bitmap.close();
    throw error;
  }
  bitmap.close();

  const texture = colorMapTextureFromCanvas(
    canvas,
    source.name || 'texture',
  );
  markTextureMapHasAlpha(texture, true);

  if (previousOwned && previousOwned !== texture) {
    disposeImageTexture(previousOwned);
  }

  return { texture, thumbUrl: dataUrlFromCanvas(canvas) };
}
