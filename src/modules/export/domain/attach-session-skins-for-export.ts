import type { Object3D } from 'three';

import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';

import {
  SESSION_SKIN_NODE_KEY,
  SESSION_SKINS_MANIFEST_KEY,
  SESSION_SKINS_MANIFEST_VERSION,
} from '@/modules/create/domain/session-skins-manifest';
import { getSessionSkinWardrobe } from '@/modules/create/stores/session-skins-store';

/**
 * Temporarily parent invisible meshes whose materials reference every session
 * wardrobe texture so `GLTFExporter` embeds them (flat zip — US-49).
 * Returns a cleanup that removes helpers and restores prior root extras.
 * Does not dispose wardrobe textures.
 */
export function attachSessionSkinsForExport(
  scene: Object3D,
  modelId: string,
): () => void {
  const wardrobe = getSessionSkinWardrobe(modelId);
  if (wardrobe.skins.length === 0) {
    return () => {};
  }

  const previousManifest = scene.userData[SESSION_SKINS_MANIFEST_KEY];
  scene.userData[SESSION_SKINS_MANIFEST_KEY] = {
    version: SESSION_SKINS_MANIFEST_VERSION,
    activeSkinId: wardrobe.activeSkinId,
    skins: wardrobe.skins.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  };

  const helpers: Mesh[] = [];
  for (const skin of wardrobe.skins) {
    const material = new MeshBasicMaterial({
      map: skin.texture,
      name: skin.label,
    });
    const mesh = new Mesh(new PlaneGeometry(0.001, 0.001), material);
    mesh.name = `threeEditorSessionSkin:${skin.id}`;
    // Must stay visible: GLTFExporter defaults to onlyVisible and would skip these.
    mesh.visible = true;
    mesh.scale.setScalar(0);
    mesh.frustumCulled = false;
    mesh.userData[SESSION_SKIN_NODE_KEY] = {
      id: skin.id,
      label: skin.label,
    };
    scene.add(mesh);
    helpers.push(mesh);
  }

  return () => {
    for (const mesh of helpers) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      const material = mesh.material;
      if (material instanceof MeshBasicMaterial) {
        material.map = null;
        material.dispose();
      }
    }
    if (previousManifest === undefined) {
      delete scene.userData[SESSION_SKINS_MANIFEST_KEY];
    } else {
      scene.userData[SESSION_SKINS_MANIFEST_KEY] = previousManifest;
    }
  };
}
