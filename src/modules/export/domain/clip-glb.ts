import type { AnimationClip, SkinnedMesh } from 'three';

import type { ClipEntry } from '@/modules/animation/types/clip';

import { Bone, Group, Object3D } from 'three';

import { bakeTimeScale } from '@/modules/animation/domain/clip-bake';
import { splitTrackName } from '@/modules/animation/domain/clip-validate';
import { exportGlbBinary } from '../adapters/gltf-exporter';
import { stripExportExtension } from '../utils/file-name';

export interface ClipGlbResult {
  arrayBuffer: ArrayBuffer;
  fileName: string;
}

function collectBones(scene: Group): Bone[] {
  const bones = new Set<Bone>();
  scene.traverse((object) => {
    const skinned = object as SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      for (const bone of skinned.skeleton.bones) {
        bones.add(bone);
      }
    }
  });
  return [...bones];
}

/** Bone graph (rest pose, no mesh geometry) so animation tracks resolve by name. */
function buildMinimalSkeletonScene(scene: Group): Group {
  const root = new Group();
  root.name = scene.name;

  const bones = collectBones(scene);
  if (bones.length === 0) {
    return root;
  }

  const clones = bones.map((bone) => bone.clone(false));
  const rootBones: Object3D[] = [];

  bones.forEach((bone, index) => {
    const parent = bone.parent;
    if (parent instanceof Bone && bones.includes(parent)) {
      clones[bones.indexOf(parent)].add(clones[index]);
    } else {
      rootBones.push(clones[index]);
    }
  });

  root.add(...rootBones);
  return root;
}

function addTrackTargetPlaceholders(scene: Group, clip: AnimationClip): void {
  const names = new Set<string>();
  scene.traverse((object) => {
    names.add(object.name);
  });

  for (const track of clip.tracks) {
    const { nodeName, suffix } = splitTrackName(track.name);
    if (!suffix || !nodeName || names.has(nodeName)) {
      continue;
    }
    const placeholder = new Object3D();
    placeholder.name = nodeName;
    scene.add(placeholder);
    names.add(nodeName);
  }
}

export async function packClipGlb(
  entry: ClipEntry,
  skeletonScene: Group,
): Promise<ClipGlbResult> {
  if (!entry.clip) {
    throw new Error(`Clip "${entry.name}" has no working AnimationClip`);
  }

  const clip = bakeTimeScale(entry.clip, entry.timeScale);

  for (const track of clip.tracks) {
    const { suffix } = splitTrackName(track.name);
    if (suffix === '.morphTargetInfluences') {
      throw new Error(
        `Clip "${entry.name}" uses morph targets, which animation-only export does not support yet`,
      );
    }
  }

  const scene = buildMinimalSkeletonScene(skeletonScene);
  addTrackTargetPlaceholders(scene, clip);

  const arrayBuffer = await exportGlbBinary(scene, [clip]);
  return { arrayBuffer, fileName: `${stripExportExtension(entry.name)}.glb` };
}
