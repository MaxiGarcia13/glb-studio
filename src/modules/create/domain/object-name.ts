import type { Object3D } from 'three';

/**
 * Next unused object name under `root`: `base`, then `base_2`, `base_3`, …
 */
export function nextObjectName(root: Object3D, base: string): string {
  const used = new Set<string>();
  root.traverse((object) => {
    if (object.name) {
      used.add(object.name);
    }
  });

  if (!used.has(base)) {
    return base;
  }

  let index = 2;
  while (used.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}
