import type { Object3D, SkinnedMesh } from 'three';

import { Bone } from 'three';

export interface BoneEntry {
  bone: Bone;
  /** Nesting depth under a skeleton root (0 = root bone). */
  depth: number;
  /** True when this bone has at least one child bone in the skeleton set. */
  hasChildren: boolean;
}

function collectSkeletonBones(scene: Object3D): Set<Bone> {
  const bones = new Set<Bone>();
  scene.traverse((object) => {
    const skinned = object as SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      for (const bone of skinned.skeleton.bones) {
        bones.add(bone);
      }
    }
  });
  return bones;
}

/**
 * Hierarchy-ordered skeleton bones for the library outliner (pre-order, with depth).
 * Empty when the scene has no skinned skeleton.
 */
export function listBoneEntries(scene: Object3D): BoneEntry[] {
  const bones = collectSkeletonBones(scene);
  if (bones.size === 0) {
    return [];
  }

  const roots: Bone[] = [];
  for (const bone of bones) {
    const parent = bone.parent;
    if (!(parent instanceof Bone) || !bones.has(parent)) {
      roots.push(bone);
    }
  }

  const entries: BoneEntry[] = [];

  function walk(bone: Bone, depth: number): void {
    const childBones = bone.children.filter(
      (child): child is Bone => child instanceof Bone && bones.has(child),
    );
    entries.push({
      bone,
      depth,
      hasChildren: childBones.length > 0,
    });
    for (const child of childBones) {
      walk(child, depth + 1);
    }
  }

  for (const root of roots) {
    walk(root, 0);
  }

  return entries;
}
