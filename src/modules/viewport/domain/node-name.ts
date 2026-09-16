import type { Object3D } from 'three';

import type { ModelEntry } from '../types/model';

/** True when another named node under `root` already uses `name` (excludes `except`). */
export function isNodeNameTaken(
  root: Object3D,
  name: string,
  except: Object3D,
): boolean {
  let taken = false;
  root.traverse((object) => {
    if (taken || object === except || !object.name) {
      return;
    }
    if (object.name === name) {
      taken = true;
    }
  });
  return taken;
}

export function findModelOwningObject(
  models: readonly ModelEntry[],
  object: Object3D,
): ModelEntry | null {
  for (const model of models) {
    let current: Object3D | null = object;
    while (current) {
      if (current === model.scene) {
        return model;
      }
      current = current.parent;
    }
  }
  return null;
}
