import type { Object3D } from 'three';
import type { CreatePartClipboardPartNode } from '@/modules/create/types/create-part-clipboard';

export function readTrs(source: Object3D): Pick<
  CreatePartClipboardPartNode,
  'position' | 'quaternion' | 'scale'
> {
  return {
    position: [source.position.x, source.position.y, source.position.z],
    quaternion: [
      source.quaternion.x,
      source.quaternion.y,
      source.quaternion.z,
      source.quaternion.w,
    ],
    scale: [source.scale.x, source.scale.y, source.scale.z],
  };
}

export function applyTrs(
  target: Object3D,
  entry: Pick<CreatePartClipboardPartNode, 'position' | 'quaternion' | 'scale'>,
  offsetX = 0,
): void {
  target.position.set(
    entry.position[0] + offsetX,
    entry.position[1],
    entry.position[2],
  );
  target.quaternion.set(
    entry.quaternion[0],
    entry.quaternion[1],
    entry.quaternion[2],
    entry.quaternion[3],
  );
  target.scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
}
