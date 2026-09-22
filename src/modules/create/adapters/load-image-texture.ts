import { SRGBColorSpace, Texture } from 'three';

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

interface CloseableImage {
  close?: () => void;
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

/**
 * Decode a local image file into an sRGB `Texture`.
 * Disposes `previous` only after a successful decode so a failed pick cannot
 * leave the part with a black / missing map.
 */
export async function loadImageTexture(
  file: File,
  previous?: Texture | null,
): Promise<Texture> {
  assertSupportedImageFile(file);

  if (typeof createImageBitmap !== 'function') {
    throw new ImageTextureError(
      `Could not decode "${file.name}". Use a PNG, JPEG, or WebP image.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
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

  const texture = new Texture(bitmap);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  texture.flipY = true;
  texture.name = file.name;

  if (previous && previous !== texture) {
    disposeImageTexture(previous);
  }

  return texture;
}
