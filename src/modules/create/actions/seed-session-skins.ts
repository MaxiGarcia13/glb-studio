import type { ModelEntry } from '@/modules/viewport/types/model';

import { isSkinnedLibraryModel } from '@/modules/import/domain/model-scene-kind';
import { resolveSkinnedTextureTarget } from '../domain/resolve-skinned-texture-target';
import { restoreSessionSkinsFromScene } from '../domain/restore-session-skins-from-scene';
import {
  appendSessionSkin,
  getSessionSkinWardrobe,
} from '../stores/session-skins-store';

/**
 * Restore the session wardrobe after model load.
 * Prefers embedded multi-skin helpers / manifest (US-49 flat export).
 * Falls back to a single entry from the live color map (US-48).
 * No-op when the list is already non-empty.
 */
export function seedSessionSkinsFromModel(model: ModelEntry): boolean {
  if (!isSkinnedLibraryModel(model)) {
    return false;
  }

  const wardrobe = getSessionSkinWardrobe(model.id);
  if (wardrobe.skins.length > 0) {
    return false;
  }

  if (restoreSessionSkinsFromScene(model)) {
    return true;
  }

  const target = resolveSkinnedTextureTarget(model.scene, null);
  const map = target?.material.map ?? null;
  if (!map) {
    return false;
  }

  appendSessionSkin(model.id, { texture: map });
  return true;
}
