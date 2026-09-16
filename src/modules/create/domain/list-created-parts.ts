import type { Mesh, Object3D } from 'three';

import { readCreatePart } from './part-data';

/**
 * Depth-first list of stamped create parts under a created model’s parts root.
 * Does not include `partsRoot` itself.
 */
export function listCreatedParts(partsRoot: Object3D): Mesh[] {
  const parts: Mesh[] = [];
  partsRoot.traverse((object) => {
    if (object === partsRoot || !readCreatePart(object)) {
      return;
    }
    const mesh = object as Mesh;
    if (!mesh.isMesh) {
      return;
    }
    parts.push(mesh);
  });
  return parts;
}
