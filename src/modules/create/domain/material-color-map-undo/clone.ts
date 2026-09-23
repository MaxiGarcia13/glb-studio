import type { MeshStandardMaterial } from 'three';
import type { MaterialColorMapSnapshot } from '@/modules/animation/types/undo-stack';
import { Texture } from 'three';

/**
 * Deep-ish clone for undo: own pixel buffer so disposing one texture cannot
 * close a shared ImageBitmap / wipe a shared canvas still on the stack.
 * Builds a new `Texture` (Three.js `clone()` shares `source` / image data).
 */
export function cloneColorMapTexture(source: Texture): Texture {
  const sourceImage = source.image;
  let image: Texture['image'] = sourceImage;

  const width
    = sourceImage && typeof (sourceImage as { width?: unknown }).width === 'number'
      ? Math.max(1, (sourceImage as { width: number }).width)
      : 1;
  const height
    = sourceImage && typeof (sourceImage as { height?: unknown }).height === 'number'
      ? Math.max(1, (sourceImage as { height: number }).height)
      : 1;

  if (typeof ImageData !== 'undefined') {
    let data: ImageData | null = null;
    if (
      typeof document !== 'undefined'
      && sourceImage
      && typeof (sourceImage as { getContext?: unknown }).getContext === 'function'
    ) {
      const scratch = document.createElement('canvas');
      scratch.width = width;
      scratch.height = height;
      const context = scratch.getContext('2d');
      if (context) {
        try {
          context.drawImage(sourceImage as CanvasImageSource, 0, 0);
          data = context.getImageData(0, 0, width, height);
        } catch {
          data = null;
        }
      }
    }
    try {
      data ??= new ImageData(width, height);
    } catch {
      data = null;
    }
    if (data) {
      image = data;
    }
  }

  // Last resort: distinct object so stack entries never share image refs.
  if (image === sourceImage) {
    image = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as unknown as Texture['image'];
  }

  const clone = new Texture(image);
  clone.colorSpace = source.colorSpace;
  clone.flipY = source.flipY;
  clone.name = source.name;
  clone.userData = { ...source.userData };
  clone.wrapS = source.wrapS;
  clone.wrapT = source.wrapT;
  clone.repeat.copy(source.repeat);
  clone.offset.copy(source.offset);
  clone.center.copy(source.center);
  clone.rotation = source.rotation;
  clone.needsUpdate = true;
  return clone;
}

/** Snapshot the live map as a stack-owned clone (or null). */
export function snapshotMaterialColorMap(
  material: MeshStandardMaterial,
): MaterialColorMapSnapshot {
  return {
    map: material.map ? cloneColorMapTexture(material.map) : null,
  };
}
