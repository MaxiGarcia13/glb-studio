import type { Object3D } from 'three';
import type { PartKindId } from '@/modules/create/types/part';

/**
 * Next unused part name for a kind in a scene: `box`, then `box_2`, `box_3`, …
 */
export function nextPartName(root: Object3D, kindId: PartKindId): string {
  const used = new Set<string>();
  root.traverse((object) => {
    if (object.name) {
      used.add(object.name);
    }
  });

  if (!used.has(kindId)) {
    return kindId;
  }

  let index = 2;
  while (used.has(`${kindId}_${index}`)) {
    index += 1;
  }
  return `${kindId}_${index}`;
}
