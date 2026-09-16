import type { Object3D } from 'three';
import type { PartKindId } from '@/modules/create/types/part';
import { nextObjectName } from './object-name';

/**
 * Next unused part name for a kind in a scene: `box`, then `box_2`, `box_3`, …
 */
export function nextPartName(root: Object3D, kindId: PartKindId): string {
  return nextObjectName(root, kindId);
}
