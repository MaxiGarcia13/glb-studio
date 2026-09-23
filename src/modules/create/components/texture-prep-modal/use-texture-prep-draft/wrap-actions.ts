import type { OwnedDraft } from './use-owned-draft';
import type { TextureWrapPresetId } from '@/modules/create/domain/color-map/texture-wrap-preset';
import { applyTextureWrapPreset } from '@/modules/create/domain/color-map/texture-wrap-preset';

/** Clamp / Tile presets on an owned draft (clones seeded maps first). */
export function createSetWrapPreset(
  owned: OwnedDraft,
): (preset: TextureWrapPresetId) => void {
  return (preset: TextureWrapPresetId) => {
    if (owned.busy) {
      return;
    }
    owned.wrapPresetRef.current = preset;
    owned.setWrapPreset(preset);
    const texture = owned.ensureOwnedDraft();
    if (!texture) {
      return;
    }
    applyTextureWrapPreset(texture, preset);
  };
}
