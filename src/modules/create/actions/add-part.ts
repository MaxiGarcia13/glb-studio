import type { Mesh } from 'three';
import type { PartKindId } from '@/modules/create/types/part';

import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { selectObject } from '@/modules/viewport/stores/selection-store';
import { selectedCreateHierarchyUuids } from '../domain/selected-create-roots';
import { spawnPart } from '../domain/spawn-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';
import { pushCreateSceneInsertUndo } from './push-create-scene-undo';

/**
 * Add a stamped part (kind defaults) under a created model's scene.
 * Switches to Edit, selects the mesh, and returns it. No-ops when missing / imported.
 * Pushes one createScene undo entry.
 */
export function addPart(modelId: string, kindId: PartKindId): Mesh | null {
  const model = $model.get().models.find((entry) => entry.id === modelId);
  if (!model || model.source !== 'created') {
    return null;
  }

  const beforeSelectUuids = selectedCreateHierarchyUuids();

  const mesh = spawnPart(model.scene, kindId);
  // Move tool gizmo is the model root — force Edit so only this part transforms.
  setEditTool('edit');
  selectObject(mesh);
  bumpCreatePartsRevision();

  pushCreateSceneInsertUndo({
    modelId,
    partsRoot: model.scene,
    insertedRoots: [mesh],
    beforeSelectUuids,
  });

  return mesh;
}
