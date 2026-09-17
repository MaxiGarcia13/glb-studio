import type { Group, Material } from 'three';
import { useEffect, useMemo } from 'react';
import { SkeletonHelper } from 'three';

interface ModelSkeletonHelperProps {
  scene: Group;
}

/**
 * Viewport bone lines for one imported model. Not pickable.
 * Mount only while the model is previewed; unmount disposes the helper.
 */
export function ModelSkeletonHelper({ scene }: ModelSkeletonHelperProps) {
  const helper = useMemo(() => {
    const next = new SkeletonHelper(scene);
    next.raycast = () => {};
    return next;
  }, [scene]);

  useEffect(() => {
    return () => {
      helper.removeFromParent();
      helper.geometry.dispose();
      const { material } = helper;
      if (Array.isArray(material)) {
        for (const entry of material) {
          entry.dispose();
        }
      } else {
        (material as Material).dispose();
      }
    };
  }, [helper]);

  return <primitive object={helper} />;
}
