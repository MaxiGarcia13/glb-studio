export interface ImageCropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const MIN_CROP_EDGE = 1;

/** Center-crop to the largest square that fits inside the image. */
export function centerSquareCrop(
  width: number,
  height: number,
): ImageCropRect {
  const side = Math.min(width, height);
  return {
    sx: Math.floor((width - side) / 2),
    sy: Math.floor((height - side) / 2),
    sw: side,
    sh: side,
  };
}

export function isAlreadySquare(width: number, height: number): boolean {
  return width > 0 && width === height;
}

export function fullImageCrop(width: number, height: number): ImageCropRect {
  return { sx: 0, sy: 0, sw: width, sh: height };
}

export function isFullImageCrop(
  crop: ImageCropRect,
  width: number,
  height: number,
): boolean {
  return (
    crop.sx === 0
    && crop.sy === 0
    && crop.sw === width
    && crop.sh === height
  );
}

/** Clamp a crop rect into the image and enforce a minimum edge size. */
export function clampImageCropRect(
  crop: ImageCropRect,
  width: number,
  height: number,
): ImageCropRect {
  if (width <= 0 || height <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0 };
  }

  const sw = Math.min(Math.max(Math.round(crop.sw), MIN_CROP_EDGE), width);
  const sh = Math.min(Math.max(Math.round(crop.sh), MIN_CROP_EDGE), height);
  let sx = Math.round(crop.sx);
  let sy = Math.round(crop.sy);

  sx = Math.min(Math.max(sx, 0), width - sw);
  sy = Math.min(Math.max(sy, 0), height - sh);

  return { sx, sy, sw, sh };
}

/**
 * Build a crop rect from two image-space corners (drag start / end).
 * Order-independent; result is clamped to the image.
 */
export function cropRectFromCorners(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  height: number,
): ImageCropRect {
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const right = Math.max(x0, x1);
  const bottom = Math.max(y0, y1);
  return clampImageCropRect(
    {
      sx: left,
      sy: top,
      sw: Math.max(right - left, MIN_CROP_EDGE),
      sh: Math.max(bottom - top, MIN_CROP_EDGE),
    },
    width,
    height,
  );
}
