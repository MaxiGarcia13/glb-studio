import type { Material, Object3D, Texture } from 'three';
import type { SessionSkinManifestRecord } from '../domain/session-skins-manifest';

import type { ModelEntry } from '@/modules/viewport/types/model';

import { Mesh } from 'three';
import {
  parseSessionSkinNodeStamp,
  parseSessionSkinsManifest,
  SESSION_SKIN_NODE_KEY,
  SESSION_SKINS_MANIFEST_KEY,

} from '../domain/session-skins-manifest';
import {
  appendSessionSkin,
  getSessionSkinWardrobe,
  setActiveSessionSkinId,
} from '../stores/session-skins-store';

function materialMap(material: Material | Material[]): Texture | null {
  if (Array.isArray(material)) {
    for (const entry of material) {
      const map = (entry as Material & { map?: Texture | null }).map ?? null;
      if (map) {
        return map;
      }
    }
    return null;
  }
  return (material as Material & { map?: Texture | null }).map ?? null;
}

function collectSkinHelpers(scene: Object3D): Mesh[] {
  const helpers: Mesh[] = [];
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    if (parseSessionSkinNodeStamp(object.userData[SESSION_SKIN_NODE_KEY])) {
      helpers.push(object);
    }
  });
  return helpers;
}

function stripSkinHelpers(helpers: Mesh[]): void {
  for (const mesh of helpers) {
    mesh.parent?.remove(mesh);
    mesh.geometry.dispose();
    const material = mesh.material;
    const materials = Array.isArray(material) ? material : [material];
    for (const entry of materials) {
      const withMap = entry as Material & { map?: Texture | null };
      if ('map' in withMap) {
        withMap.map = null;
      }
      entry.dispose();
    }
  }
}

/**
 * Rebuild the session wardrobe from embedded helper nodes + root manifest,
 * then strip those helpers from the scene. Returns true when any skin restored.
 */
export function restoreSessionSkinsFromScene(model: ModelEntry): boolean {
  const helpers = collectSkinHelpers(model.scene);
  const manifest = parseSessionSkinsManifest(
    model.scene.userData[SESSION_SKINS_MANIFEST_KEY],
  );

  if (helpers.length === 0 && !manifest) {
    return false;
  }

  const textureById = new Map<string, { texture: Texture; label: string }>();
  for (const helper of helpers) {
    const stamp = parseSessionSkinNodeStamp(
      helper.userData[SESSION_SKIN_NODE_KEY],
    );
    const map = materialMap(helper.material);
    if (!stamp || !map) {
      continue;
    }
    textureById.set(stamp.id, {
      texture: map,
      label: stamp.label,
    });
  }

  const records: SessionSkinManifestRecord[] = manifest?.skins
    ?? [...textureById.entries()].map(([id, value]) => ({
      id,
      label: value.label,
    }));

  for (const record of records) {
    const found = textureById.get(record.id);
    if (!found) {
      continue;
    }
    appendSessionSkin(model.id, {
      id: record.id,
      label: record.label,
      texture: found.texture,
    });
  }

  if (manifest) {
    setActiveSessionSkinId(model.id, manifest.activeSkinId);
  }

  stripSkinHelpers(helpers);
  delete model.scene.userData[SESSION_SKINS_MANIFEST_KEY];

  return getSessionSkinWardrobe(model.id).skins.length > 0;
}
