import type { Object3D } from 'three';

import { collectLiveColorMaps } from '../domain/collect-live-color-maps';
import { resolveSkinnedTextureTarget } from '../domain/resolve-skinned-texture-target';
import {
  getSessionSkin,
  getSessionSkinWardrobe,
  removeSessionSkinEntry,
  setActiveSessionSkinId,
} from '../stores/session-skins-store';
import { commitMaterialColorMapChange } from './commit-material-color-map';

/**
 * Drop a wardrobe entry. If it was active, clear the live map in the same
 * undoable material commit, then dispose the entry (US-48 remove-active).
 */
export function removeSessionSkin(options: {
  modelId: string;
  skinId: string;
  scene: Object3D;
  selected?: Object3D | null;
}): boolean {
  const { modelId, skinId, scene, selected } = options;
  const entry = getSessionSkin(modelId, skinId);
  if (!entry) {
    return false;
  }

  const wardrobe = getSessionSkinWardrobe(modelId);
  const wasActive = wardrobe.activeSkinId === skinId;
  const liveMaps = collectLiveColorMaps(scene);
  const target = resolveSkinnedTextureTarget(scene, selected);

  if (wasActive && target) {
    setActiveSessionSkinId(modelId, null);
    commitMaterialColorMapChange({
      modelId,
      meshUuid: target.mesh.uuid,
      material: target.material,
      next: null,
    });
    // Live map cleared — safe to dispose wardrobe texture.
    removeSessionSkinEntry(modelId, skinId);
    return true;
  }

  removeSessionSkinEntry(modelId, skinId, { liveMaps });
  return true;
}
