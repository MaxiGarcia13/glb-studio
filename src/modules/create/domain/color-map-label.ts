import type { Texture } from 'three';

/**
 * Library row label for a color map.
 * Prefer `texture.name` / file name; fallback `"Texture"`.
 */
export function labelForColorMap(texture: Texture): string {
  const name = texture.name.trim();
  return name.length > 0 ? name : 'Texture';
}
