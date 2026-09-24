import type { Object3D } from 'three';

import { $commandStack, pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import { collectLiveColorMaps } from '../domain/color-map/collect-live-color-maps';
import {
  assignMaterialColorMapLive,
  collectStackOwnedColorMaps,
  releaseOrphanColorMap,
  snapshotMaterialColorMap,
} from '../domain/color-map/material-color-map-undo';
import { resolveSkinnedTextureTarget } from '../domain/color-map/resolve-skinned-texture-target';
import { bumpMaterialMapsRevision } from '../stores/material-maps-revision-store';
import {
  collectSessionSkinTextures,
  getSessionSkin,
  getSessionSkinWardrobe,
  removeSessionSkinEntry,
  setActiveSessionSkinId,
} from '../stores/session-skins-store';

/**
 * Drop a wardrobe entry. If it was active, clear the live map and drop the
 * entry in **one** `materialColorMap` undo command: one undo restores
 * both the list entry and the map.
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
  const index = wardrobe.skins.findIndex((skin) => skin.id === skinId);
  const liveMaps = collectLiveColorMaps(scene);
  const target = resolveSkinnedTextureTarget(scene, selected);

  if (wasActive && target && index >= 0) {
    const { material, mesh } = target;
    const before = snapshotMaterialColorMap(material);
    setActiveSessionSkinId(modelId, null);
    const previous = assignMaterialColorMapLive(material, null);
    // Drop list entry but keep texture until orphan release (stack owns a clone).
    removeSessionSkinEntry(modelId, skinId, { dispose: false });
    releaseOrphanColorMap(previous, [
      ...collectStackOwnedColorMaps($commandStack.get()),
      ...collectSessionSkinTextures(modelId),
      before.map,
    ]);
    const after = snapshotMaterialColorMap(material);

    pushUndoableCommand({
      id: 'materialColorMap',
      modelId,
      meshUuid: mesh.uuid,
      before,
      after,
      sessionSkinRemoval: {
        skinId: entry.id,
        label: entry.label,
        index,
      },
    });
    bumpMaterialMapsRevision();
    return true;
  }

  removeSessionSkinEntry(modelId, skinId, { liveMaps });
  return true;
}
