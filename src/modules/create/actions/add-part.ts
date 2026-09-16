import type { Mesh } from 'three';
import type { PartKindId } from '@/modules/create/types/part';

import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model } from '@/modules/viewport/stores/model-store';
import { selectObject } from '@/modules/viewport/stores/selection-store';
import { spawnPart } from '../domain/spawn-part';
import { bumpCreatePartsRevision } from '../stores/create-parts-revision-store';

/**
 * Add a stamped part (kind defaults) under a created model's scene.
 * Switches to Edit, selects the mesh, and returns it. No-ops when missing / imported.
 */
export function addPart(modelId: string, kindId: PartKindId): Mesh | null {
  const model = $model.get().models.find((entry) => entry.id === modelId);
  if (!model || model.source !== 'created') {
    return null;
  }

  const mesh = spawnPart(model.scene, kindId);
  // Move tool gizmo is the model root — force Edit so only this part transforms.
  setEditTool('edit');
  selectObject(mesh);
  bumpCreatePartsRevision();
  return mesh;
}
