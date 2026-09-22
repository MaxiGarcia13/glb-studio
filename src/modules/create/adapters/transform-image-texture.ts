import type { Texture } from 'three';
import type { ImageCropRect } from '@/modules/create/domain/texture-crop';

import { disposeImageTexture } from '@/utils/dispose-image-texture';
import {
  colorMapTextureFromCanvas,
  dataUrlFromCanvas,
  ImageTextureError,
} from './load-image-texture';

export interface ImageTextureTransform {
  flipX?: boolean;
  flipY?: boolean;
  crop?: ImageCropRect;
}

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
    throw new ImageTextureError('Could not transform this image.');
  }
  return { width, height };
}

function assertCropFits(
  crop: ImageCropRect,
  width: number,
  height: number,
): void {
  if (
    crop.sx < 0
    || crop.sy < 0
    || crop.sw <= 0
    || crop.sh <= 0
    || crop.sx + crop.sw > width
    || crop.sy + crop.sh > height
  ) {
    throw new ImageTextureError('Crop region is outside the image.');
  }
}

/**
 * Draw `source` through optional crop + flip into a new sRGB texture.
 * Uses a canvas source so Three.js honors `flipY` (ImageBitmap ignores it).
 * Disposes `previousOwned` only after success (never disposes `source` when
 * it is a seeded live map distinct from `previousOwned`).
 */
export async function transformImageTexture(
  source: Texture,
  transform: ImageTextureTransform,
  previousOwned?: Texture | null,
): Promise<{ texture: Texture; thumbUrl: string | null }> {
  const image = source.image as CanvasImageSource & {
    width?: number;
    height?: number;
  };
  if (!image) {
    throw new ImageTextureError('Could not transform this image.');
  }

  const { width, height } = sourceImageSize(image);
  const crop = transform.crop ?? {
    sx: 0,
    sy: 0,
    sw: width,
    sh: height,
  };
  assertCropFits(crop, width, height);

  const canvas = document.createElement('canvas');
  canvas.width = crop.sw;
  canvas.height = crop.sh;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageTextureError('Could not transform this image.');
  }

  const flipX = Boolean(transform.flipX);
  const flipY = Boolean(transform.flipY);
  context.save();
  if (flipX || flipY) {
    context.translate(flipX ? crop.sw : 0, flipY ? crop.sh : 0);
    context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  }
  context.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    crop.sw,
    crop.sh,
  );
  context.restore();

  const texture = colorMapTextureFromCanvas(
    canvas,
    source.name || 'texture',
  );

  if (previousOwned && previousOwned !== texture) {
    disposeImageTexture(previousOwned);
  }

  return { texture, thumbUrl: dataUrlFromCanvas(canvas) };
}
