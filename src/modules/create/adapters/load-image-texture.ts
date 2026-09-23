import { SRGBColorSpace, Texture } from 'three';

import { disposeImageTexture } from '@/utils/dispose-image-texture';

/** Client-side cap so a huge dump cannot stall the tab or fill GPU memory. */
export const MAX_PART_COLOR_MAP_BYTES = 16 * 1024 * 1024;
export const MAX_PART_COLOR_MAP_EDGE = 8192;

export const PART_COLOR_MAP_ACCEPT
  = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';

const SUPPORTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const SUPPORTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

export class ImageTextureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageTextureError';
  }
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) {
    return '';
  }
  return name.slice(dot + 1).toLowerCase();
}

function isSupportedImageFile(file: File): boolean {
  if (file.type && SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  return SUPPORTED_EXTENSIONS.has(fileExtension(file.name));
}

function assertSupportedImageFile(file: File): void {
  if (!isSupportedImageFile(file)) {
    throw new ImageTextureError(
      `"${file.name}" is not a supported image. Use PNG, JPEG, or WebP.`,
    );
  }
  if (file.size > MAX_PART_COLOR_MAP_BYTES) {
    throw new ImageTextureError(
      `"${file.name}" is too large (max 16 MB).`,
    );
  }
}

function assertBitmapSize(bitmap: ImageBitmap, fileName: string): void {
  const edge = Math.max(bitmap.width, bitmap.height);
  if (edge > MAX_PART_COLOR_MAP_EDGE) {
    throw new ImageTextureError(
      `"${fileName}" is too large (max ${MAX_PART_COLOR_MAP_EDGE} px on an edge).`,
    );
  }
}

/**
 * Decode with EXIF orientation applied so GPU pixels match how `<img>` shows
 * the file. Falls back when the option is unsupported.
 */
async function decodeImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return createImageBitmap(file);
  }
}

/**
 * Blit a drawable into a canvas. Three.js ignores `flipY` for ImageBitmap, so
 * color maps must use a canvas (or similar) source for correct orientation.
 */
export function canvasFromDrawable(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageTextureError('Could not prepare this image.');
  }
  context.drawImage(source, 0, 0);
  return canvas;
}

/** sRGB color-map texture from a canvas so `flipY` is honored on upload. */
export function colorMapTextureFromCanvas(
  canvas: HTMLCanvasElement,
  name: string,
  flipY = true,
): Texture {
  const texture = new Texture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  texture.flipY = flipY;
  texture.name = name;
  return texture;
}

/** PNG data-URL thumbnail from the canvas that backs the draft texture. */
export function dataUrlFromCanvas(canvas: HTMLCanvasElement): string | null {
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export interface LoadImageTextureOptions {
  /**
   * Three.js / create-part default is `true`.
   * Use `false` for maps on glTF / skinned meshes (glTF UV origin is top-left).
   */
  flipY?: boolean;
}

/**
 * Decode a local image file into an sRGB `Texture`.
 * Disposes `previous` only after a successful decode so a failed pick cannot
 * leave the material with a black / missing map.
 */
export async function loadImageTexture(
  file: File,
  previous?: Texture | null,
  options?: LoadImageTextureOptions,
): Promise<Texture> {
  assertSupportedImageFile(file);

  if (typeof createImageBitmap !== 'function') {
    throw new ImageTextureError(
      `Could not decode "${file.name}". Use a PNG, JPEG, or WebP image.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImageBitmap(file);
  } catch {
    throw new ImageTextureError(
      `Could not decode "${file.name}". Use a PNG, JPEG, or WebP image.`,
    );
  }

  try {
    assertBitmapSize(bitmap, file.name);
  } catch (error) {
    bitmap.close();
    throw error;
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = canvasFromDrawable(bitmap, bitmap.width, bitmap.height);
  } catch (error) {
    bitmap.close();
    throw error;
  }
  bitmap.close();

  const flipY = options?.flipY ?? true;
  const texture = colorMapTextureFromCanvas(canvas, file.name, flipY);

  if (previous && previous !== texture) {
    disposeImageTexture(previous);
  }

  return texture;
}
