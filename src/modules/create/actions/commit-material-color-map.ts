import type { MeshStandardMaterial, Texture } from 'three';

import { $commandStack, pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import {
  assignMaterialColorMapLive,
  collectStackOwnedColorMaps,
  releaseOrphanColorMap,
  snapshotMaterialColorMap,
} from '../domain/material-color-map-undo';
import { bumpMaterialMapsRevision } from '../stores/material-maps-revision-store';

/**
 * Assign a color map (or clear) and push one `materialColorMap` undo entry.
 * Failed decode must not call this — only successful commits.
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
  releaseOrphanColorMap(
    previous,
    collectStackOwnedColorMaps($commandStack.get()),
  );
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
