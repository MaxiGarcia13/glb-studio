import type { ModelEntry } from '@/modules/viewport/types/model';

import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';
import { resolveSkinnedTextureTarget } from '../domain/resolve-skinned-texture-target';
import {
  appendSessionSkin,
  getSessionSkinWardrobe,
} from '../stores/session-skins-store';

/**
 * If a skinned library model already has a color map on the resolved US-40
 * target, seed one wardrobe entry (active). No-op when the list is non-empty
 * or there is no map (US-48 import seed).
 */
export function seedSessionSkinsFromModel(model: ModelEntry): boolean {
  if (!isSkinnedLibraryModel(model)) {
    return false;
  }

  const wardrobe = getSessionSkinWardrobe(model.id);
  if (wardrobe.skins.length > 0) {
    return false;
  }

  const target = resolveSkinnedTextureTarget(model.scene, null);
  const map = target?.material.map ?? null;
  if (!map) {
    return false;
  }

  appendSessionSkin(model.id, { texture: map });
  return true;
}
