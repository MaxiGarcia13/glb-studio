import type { AnimationClip, Object3D, SkinnedMesh } from 'three';
import type { BoneBindFrame } from '@/modules/animation/types/clip';

import { Bone, Quaternion } from 'three';

import { collectClipTargetNodeNames } from '@/modules/animation/domain/clip-validate';

const _parentWorldQuat = new Quaternion();

function identityQuatTuple(): [number, number, number, number] {
  return [0, 0, 0, 1];
}

function quatTuple(q: Quaternion): [number, number, number, number] {
  return [q.x, q.y, q.z, q.w];
}

function frameForObject(object: Object3D): BoneBindFrame {
  const localPosition: [number, number, number] = [
    object.position.x,
    object.position.y,
    object.position.z,
  ];
  if (object.parent) {
    object.parent.getWorldQuaternion(_parentWorldQuat);
    return {
      localPosition,
      parentWorldQuaternion: quatTuple(_parentWorldQuat),
    };
  }
  return {
    localPosition,
    parentWorldQuaternion: identityQuatTuple(),
  };
}

function captureBoneBindFrames(scene: Object3D): Record<string, BoneBindFrame> {
  const frames: Record<string, BoneBindFrame> = {};

  const addBone = (bone: Bone) => {
    if (!bone.name || bone.name in frames) {
      return;
    }
    frames[bone.name] = frameForObject(bone);
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

  return frames;
}

/**
 * Rest TRS for named nodes (used when the GLB has no Skin / Bone — e.g. Mixamo
 * without-skin after fbx2gltf).
 */
export function captureBindFramesFromNodeNames(
  scene: Object3D,
  nodeNames: Iterable<string>,
): Record<string, BoneBindFrame> {
  scene.updateMatrixWorld(true);
  const frames: Record<string, BoneBindFrame> = {};
  for (const name of nodeNames) {
    if (!name || name in frames) {
      continue;
    }
    const object = scene.getObjectByName(name);
    if (!object) {
      continue;
    }
    frames[name] = frameForObject(object);
  }
  return frames;
}

/**
 * Rest-pose local position + parent world quaternion per bone from a GLB scene.
 * Same bone set as `buildTargetBoneNames` / `captureBindLengths`.
 *
 * When the scene has no Bones/SkinnedMesh (meshless animation FBX → GLB) and
 * `clips` are provided, falls back to clip track target nodes.
 */
export function captureBindFrames(
  scene: Object3D,
  clips?: readonly AnimationClip[],
): Record<string, BoneBindFrame> {
  scene.updateMatrixWorld(true);
  const frames = captureBoneBindFrames(scene);
  if (Object.keys(frames).length > 0 || !clips?.length) {
    return frames;
  }
  return captureBindFramesFromNodeNames(scene, collectClipTargetNodeNames(clips));
}
