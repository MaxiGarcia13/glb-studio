import type { Texture } from 'three';
import { ClampToEdgeWrapping, RepeatWrapping } from 'three';

/** UI / draft wrap choices for created-part color maps (US-39). */
export type TextureWrapPresetId = 'clamp' | 'tile-2' | 'tile-4';

export interface TextureWrapPresetOption {
  id: TextureWrapPresetId;
  label: string;
  title: string;
}

export const TEXTURE_WRAP_PRESETS: readonly TextureWrapPresetOption[] = [
  {
    id: 'clamp',
    label: 'Clamp',
    title: 'Stretch to fit without tiling',
  },
  {
    id: 'tile-2',
    label: 'Tile 2×',
    title: 'Repeat the image 2×2 across the part',
  },
  {
    id: 'tile-4',
    label: 'Tile 4×',
    title: 'Repeat the image 4×4 across the part',
  },
] as const;

/**
 * Map a preset to Three.js wrap + repeat on the draft texture.
 * Does not mutate UVs — primitives keep default 0–1 mapping.
 */
export function applyTextureWrapPreset(
  texture: Texture,
  preset: TextureWrapPresetId,
): void {
  switch (preset) {
    case 'tile-2':
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(2, 2);
      break;
    case 'tile-4':
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(4, 4);
      break;
    case 'clamp':
    default:
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.repeat.set(1, 1);
      break;
  }
  texture.needsUpdate = true;
}

/** Best-effort match for seeding the modal from an existing part map. */
export function inferTextureWrapPreset(
  texture: Texture,
): TextureWrapPresetId {
  const { x, y } = texture.repeat;
  if (
    texture.wrapS === RepeatWrapping
    && texture.wrapT === RepeatWrapping
    && x === 4
    && y === 4
  ) {
    return 'tile-4';
  }
  if (
    texture.wrapS === RepeatWrapping
    && texture.wrapT === RepeatWrapping
    && x === 2
    && y === 2
  ) {
    return 'tile-2';
  }
  return 'clamp';
}
