import type { Object3D, Texture } from 'three';

/**
 * Collect distinct `material.map` textures under a scene.
 * Used so wardrobe dispose can skip maps the scene disposer will free.
 */
export function collectLiveColorMaps(scene: Object3D): Set<Texture> {
  const live = new Set<Texture>();
  scene.traverse((object) => {
    const material = (object as { material?: unknown }).material;
    if (!material) {
      return;
    }
    const materials = Array.isArray(material) ? material : [material];
    for (const mat of materials) {
      const map = (mat as { map?: Texture | null }).map;
      if (map) {
        live.add(map);
      }
    }
  });
  return live;
}
