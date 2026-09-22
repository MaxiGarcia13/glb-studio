import type { MeshStandardMaterial, Texture } from 'three';

const HAS_ALPHA_USERDATA = 'partColorMapHasAlpha';

/** Prefer this after ops that known-produce alpha (e.g. bg-remove). */
export function markTextureMapHasAlpha(
  texture: Texture,
  hasAlpha = true,
): void {
  texture.userData[HAS_ALPHA_USERDATA] = hasAlpha;
}

function canvasHasTransparentPixel(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || canvas.width <= 0 || canvas.height <= 0) {
    return false;
  }
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixelCount = canvas.width * canvas.height;
  // Cap reads on large maps — soft-warn path is ≤2k; hard cap is 8k.
  const stride = Math.max(1, Math.ceil(pixelCount / 4096));
  for (let pixel = 0; pixel < pixelCount; pixel += stride) {
    if (data[pixel * 4 + 3]! < 255) {
      return true;
    }
  }
  return data[data.length - 1]! < 255;
}

/** True when the color map should drive cutout / transparent shading. */
export function textureMapHasAlpha(
  texture: Texture | null | undefined,
): boolean {
  if (!texture) {
    return false;
  }
  const flagged = texture.userData[HAS_ALPHA_USERDATA];
  if (flagged === true) {
    return true;
  }
  if (flagged === false) {
    return false;
  }
  const image = texture.image;
  if (
    typeof HTMLCanvasElement !== 'undefined'
    && image instanceof HTMLCanvasElement
  ) {
    return canvasHasTransparentPixel(image);
  }
  return false;
}

/**
 * Enable MeshStandardMaterial cutouts when the map has alpha; clear when not.
 * `alphaTest` discards near-zero coverage so depth sorting stays sane.
 */
export function syncMaterialMapAlpha(
  material: MeshStandardMaterial,
  texture: Texture | null | undefined,
): void {
  const hasAlpha = textureMapHasAlpha(texture);
  material.transparent = hasAlpha;
  material.alphaTest = hasAlpha ? 0.5 : 0;
}
