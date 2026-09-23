import type { MeshStandardMaterial, Texture } from 'three';
import type { MaterialColorMapSnapshot } from '@/modules/animation/types/undo-stack';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { bumpMaterialMapsRevision } from '../../stores/material-maps-revision-store';
import {
  insertSessionSkinAt,
  removeSessionSkinEntry,
  setActiveSessionSkinId,
} from '../../stores/session-skins-store';
import { findMeshStandardMaterial } from '../../utils/selected-part';
import { applyColorMap } from '../material-color-map';
import { syncMaterialMapAlpha } from '../texture-map-alpha';
import { cloneColorMapTexture } from './clone';
import {
  releaseOrphanColorMap,
  type MaterialColorMapCommand,
} from './stack';

export type { MaterialColorMapCommand } from './stack';

/**
 * Assign a snapshot map without disposing stack-owned textures.
 * Orphan live maps (not in `stackOwned`) are freed.
 */
export function restoreMaterialColorMap(
  material: MeshStandardMaterial,
  snapshot: MaterialColorMapSnapshot,
  stackOwned: readonly (Texture | null | undefined)[],
): void {
  const live = material.map;
  if (snapshot.map) {
    applyColorMap(material, snapshot.map);
  } else {
    material.map = null;
    syncMaterialMapAlpha(material, null);
    material.needsUpdate = true;
  }

  if (
    live
    && live !== snapshot.map
    && !stackOwned.includes(live)
  ) {
    disposeImageTexture(live);
  }
}

/**
 * Assign a live map without disposing. Pair with `releaseOrphanColorMap` so
 * stack-owned undo clones survive until pruned.
 */
export function assignMaterialColorMapLive(
  material: MeshStandardMaterial,
  next: Texture | null,
): Texture | null {
  const previous = material.map;
  if (next) {
    applyColorMap(material, next);
  } else {
    material.map = null;
    syncMaterialMapAlpha(material, null);
    material.needsUpdate = true;
  }
  return previous;
}

/** Apply undo/redo for a materialColorMap stack entry onto the live model. */
export function applyMaterialColorMapCommand(
  command: MaterialColorMapCommand,
  direction: 'undo' | 'redo',
  models: readonly ModelEntry[],
): void {
  const model = models.find((entry) => entry.id === command.modelId);
  if (!model) {
    return;
  }

  const mesh = model.scene.getObjectByProperty('uuid', command.meshUuid);
  const material = findMeshStandardMaterial(mesh ?? null);
  if (!material) {
    return;
  }

  const removal = command.sessionSkinRemoval;

  if (removal && direction === 'undo' && command.before.map) {
    // Wardrobe + live share one clone so export / pick stay consistent.
    const texture = cloneColorMapTexture(command.before.map);
    insertSessionSkinAt(
      command.modelId,
      {
        id: removal.skinId,
        label: removal.label,
        texture,
      },
      removal.index,
    );
    restoreMaterialColorMap(material, { map: texture }, [
      command.before.map,
      command.after.map,
      texture,
    ]);
    bumpMaterialMapsRevision();
    return;
  }

  if (removal && direction === 'redo') {
    setActiveSessionSkinId(command.modelId, null);
    const previous = assignMaterialColorMapLive(material, null);
    removeSessionSkinEntry(command.modelId, removal.skinId, { dispose: false });
    releaseOrphanColorMap(previous, [
      command.before.map,
      command.after.map,
    ]);
    bumpMaterialMapsRevision();
    return;
  }

  const snapshot = direction === 'undo' ? command.before : command.after;
  restoreMaterialColorMap(material, snapshot, [
    command.before.map,
    command.after.map,
  ]);
  bumpMaterialMapsRevision();
}
