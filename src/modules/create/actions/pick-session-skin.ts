import type { MeshStandardMaterial, Object3D } from 'three';

import { resolveSkinnedTextureTarget } from '../domain/color-map/resolve-skinned-texture-target';
import {
  getSessionSkin,
  getSessionSkinWardrobe,
  setActiveSessionSkinId,
} from '../stores/session-skins-store';
import { commitMaterialColorMapChange } from './commit-material-color-map';

function resolveTarget(
  scene: Object3D,
  selected: Object3D | null | undefined,
): { meshUuid: string; material: MeshStandardMaterial } | null {
  const target = resolveSkinnedTextureTarget(scene, selected);
  if (!target) {
    return null;
  }
  return { meshUuid: target.mesh.uuid, material: target.material };
}

/**
 * Make a wardrobe entry live on the resolved US-40 target and mark it active.
 * Export continues to pack only the live material map.
 */
export function pickSessionSkin(options: {
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

  const target = resolveTarget(scene, selected);
  if (!target) {
    return false;
  }

  const wardrobe = getSessionSkinWardrobe(modelId);
  if (
    wardrobe.activeSkinId === skinId
    && target.material.map === entry.texture
  ) {
    return true;
  }

  setActiveSessionSkinId(modelId, skinId);
  commitMaterialColorMapChange({
    modelId,
    meshUuid: target.meshUuid,
    material: target.material,
    next: entry.texture,
  });
  return true;
}

/**
 * Explicit “No skin”: clear the live map and leave `activeSkinId` null.
 */
export function pickNoSessionSkin(options: {
  modelId: string;
  scene: Object3D;
  selected?: Object3D | null;
}): boolean {
  const { modelId, scene, selected } = options;
  const target = resolveTarget(scene, selected);
  if (!target) {
    return false;
  }

  const wardrobe = getSessionSkinWardrobe(modelId);
  if (wardrobe.activeSkinId === null && !target.material.map) {
    return true;
  }

  setActiveSessionSkinId(modelId, null);
  commitMaterialColorMapChange({
    modelId,
    meshUuid: target.meshUuid,
    material: target.material,
    next: null,
  });
  return true;
}
