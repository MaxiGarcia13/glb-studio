import type { AnimationClip, Object3D, SkinnedMesh } from 'three';

import { Bone } from 'three';

import { collectClipTargetNodeNames } from '@/modules/animation/domain/clip-validate';
import { BONE_VENDOR_ADAPTERS } from '../adapters/bone-vendors';

/**
 * Suggest a target bone: exact name first, then the first vendor adapter
 * that returns a confident match.
 */
export function suggestTargetBone(
  sourceBoneName: string,
  targetBoneNames: Set<string>,
): string | null {
  if (targetBoneNames.has(sourceBoneName)) {
    return sourceBoneName;
  }

  for (const adapter of BONE_VENDOR_ADAPTERS) {
    const suggested = adapter.suggest(sourceBoneName, targetBoneNames);
    if (suggested && targetBoneNames.has(suggested)) {
      return suggested;
    }
  }

  return null;
}

/** Short UI label from the first recognizing vendor; otherwise the raw name. */
export function boneDisplayName(boneName: string): string {
  for (const adapter of BONE_VENDOR_ADAPTERS) {
    const label = adapter.displayName(boneName);
    if (label) {
      return label;
    }
  }
  return boneName;
}

/**
 * Dropdown / list label. When several bones share a short name, append the
 * raw id so options stay unique and honest.
 */
export function boneOptionLabel(
  boneName: string,
  siblingNames: Iterable<string>,
): string {
  const label = boneDisplayName(boneName);
  let collisions = 0;
  for (const sibling of siblingNames) {
    if (boneDisplayName(sibling) === label) {
      collisions += 1;
      if (collisions > 1) {
        return `${label} (${boneName})`;
      }
    }
  }
  return label;
}

export function buildAutoMapping(
  sourceBoneNames: string[],
  targetBoneNames: Set<string>,
): Map<string, string> {
  const mapping = new Map<string, string>();
  for (const sourceName of sourceBoneNames) {
    const suggested = suggestTargetBone(sourceName, targetBoneNames);
    if (suggested) {
      mapping.set(sourceName, suggested);
    }
  }
  return mapping;
}

export function extractSourceBoneNames(
  trackNames: string[],
  suffixes: string[],
): string[] {
  const boneNames = new Set<string>();
  for (const trackName of trackNames) {
    let name = trackName;
    for (const suffix of suffixes) {
      if (name.endsWith(suffix)) {
        name = name.slice(0, -suffix.length);
        break;
      }
    }
    if (name) {
      boneNames.add(name);
    }
  }
  return [...boneNames];
}

/** Skeleton bones only — excludes meshes, armatures, and scene roots. */
export function buildTargetBoneNames(scene: Object3D): Set<string> {
  const names = new Set<string>();

  scene.traverse((object) => {
    if (object instanceof Bone && object.name) {
      names.add(object.name);
    }

    const skinned = object as SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      for (const bone of skinned.skeleton.bones) {
        if (bone.name) {
          names.add(bone.name);
        }
      }
    }
  });

  return names;
}

/**
 * Rest-pose local-position lengths for named nodes (meshless animation sources).
 */
export function captureBindLengthsFromNodeNames(
  scene: Object3D,
  nodeNames: Iterable<string>,
): Record<string, number> {
  const lengths: Record<string, number> = {};
  for (const name of nodeNames) {
    if (!name || name in lengths) {
      continue;
    }
    const object = scene.getObjectByName(name);
    if (!object) {
      continue;
    }
    lengths[name] = object.position.length();
  }
  return lengths;
}

/**
 * Rest-pose local-position lengths (bone name → ‖position‖) from a GLB scene.
 * Same bone set as `buildTargetBoneNames`, used to derive the position
 * scale ratio at Apply.
 *
 * When the scene has no Bones/SkinnedMesh and `clips` are provided, falls back
 * to clip track target nodes (Mixamo without-skin after fbx2gltf).
 */
export function captureBindLengths(
  scene: Object3D,
  clips?: readonly AnimationClip[],
): Record<string, number> {
  const lengths: Record<string, number> = {};

  const addBone = (bone: Bone) => {
    if (bone.name && !(bone.name in lengths)) {
      lengths[bone.name] = bone.position.length();
    }
  };

  scene.traverse((object) => {
    if (object instanceof Bone && object.name) {
      addBone(object);
    }

    const skinned = object as SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      for (const bone of skinned.skeleton.bones) {
        addBone(bone);
      }
    }
  });

  if (Object.keys(lengths).length > 0 || !clips?.length) {
    return lengths;
  }
  return captureBindLengthsFromNodeNames(scene, collectClipTargetNodeNames(clips));
}
