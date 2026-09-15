import type { Mesh } from 'three';
import type { PartKindId } from '@/modules/create/types/part';

import { $model } from '@/modules/viewport/stores/model-store';
import { spawnPart } from '../domain/spawn-part';

/**
 * Add a stamped part (kind defaults) under a created model's scene.
 * Returns the mesh for selection; no-ops when the model is missing or imported.
 */
export function addPart(modelId: string, kindId: PartKindId): Mesh | null {
  const model = $model.get().models.find((entry) => entry.id === modelId);
  if (!model || model.source !== 'created') {
    return null;
  }

  return spawnPart(model.scene, kindId);
}
