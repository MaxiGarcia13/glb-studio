/** Prefer ≤ this long edge; larger still allowed up to the hard max. */
export const TEXTURE_PREP_SOFT_EDGE_PX = 2048;

/** Warn when longer/shorter side ratio exceeds this (non-square-ish). */
export const TEXTURE_PREP_SOFT_ASPECT_RATIO = 1.5;

export const TEXTURE_PREP_GUIDANCE
  = 'Prefer a square or part-friendly aspect. Use PNG for transparency. Aim for ≤ 2048px on the long edge (hard cap is higher). Flat logos and patterns work better than busy photos.';

/**
 * Soft (non-blocking) prep hints after a successful decode.
 * Hard rejects stay in `loadImageTexture` / `ImageTextureError`.
 */
export function texturePrepSoftWarnings(
  width: number,
  height: number,
): string[] {
  const warnings: string[] = [];
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);

  if (shortEdge > 0 && longEdge / shortEdge > TEXTURE_PREP_SOFT_ASPECT_RATIO) {
    warnings.push(
      'Image is not square-ish; crop or pick a closer aspect for a better fit.',
    );
  }

  if (longEdge > TEXTURE_PREP_SOFT_EDGE_PX) {
    warnings.push(
      `Image is large (${longEdge}px on the long edge). Aim for ≤ ${TEXTURE_PREP_SOFT_EDGE_PX}px when you can.`,
    );
  }

  return warnings;
}
