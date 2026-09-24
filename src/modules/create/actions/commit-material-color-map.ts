import type { MeshStandardMaterial, Texture } from 'three';

import { $commandStack, pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import {
  assignMaterialColorMapLive,
  collectStackOwnedColorMaps,
  releaseOrphanColorMap,
  snapshotMaterialColorMap,
} from '../domain/color-map/material-color-map-undo';
import { bumpMaterialMapsRevision } from '../stores/material-maps-revision-store';
import { collectSessionSkinTextures } from '../stores/session-skins-store';

/**
 * Assign a color map (or clear) and push one `materialColorMap` undo entry.
 * Failed decode must not call this — only successful commits.
 * Session wardrobe textures for `modelId` are never freed as live orphans.
 */
export function commitMaterialColorMapChange(options: {
  modelId: string;
  meshUuid: string;
  material: MeshStandardMaterial;
  next: Texture | null;
}): void {
  const { modelId, meshUuid, material, next } = options;
  const before = snapshotMaterialColorMap(material);
  const previous = assignMaterialColorMapLive(material, next);
  releaseOrphanColorMap(previous, [
    ...collectStackOwnedColorMaps($commandStack.get()),
    ...collectSessionSkinTextures(modelId),
  ]);
  const after = snapshotMaterialColorMap(material);

  pushUndoableCommand({
    id: 'materialColorMap',
    modelId,
    meshUuid,
    before,
    after,
  });
  bumpMaterialMapsRevision();
}
