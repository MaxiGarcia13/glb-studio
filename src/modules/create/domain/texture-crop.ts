export interface ImageCropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

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
