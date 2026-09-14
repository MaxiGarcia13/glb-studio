import type { Object3D } from 'three';
import type { ModelEntry } from '../types/model';

/** Walk ancestors until a loaded model root scene is found. */
export function findModelEntryForObject(
  object: Object3D,
  models: readonly ModelEntry[],
): ModelEntry | null {
  for (const model of models) {
    let node: Object3D | null = object;
    while (node) {
      if (node === model.scene) {
        return model;
      }
      node = node.parent;
    }
  }
  return null;
}
