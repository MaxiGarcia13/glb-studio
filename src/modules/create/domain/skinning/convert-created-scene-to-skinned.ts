import type { Object3D } from 'three';
import { Group, Skeleton } from 'three';

import { bindMeshesRigid } from './bind-meshes-rigid';
import { buildBonesFromCreateGroups } from './build-bones-from-create-groups';

/**
 * Convert a created-model scene (create groups + stamped parts) into a skinned
 * scene with Bone hierarchy + rigid SkinnedMeshes. Does not mutate `sourceScene`.
 */
export function convertCreatedSceneToSkinned(sourceScene: Object3D): Group {
  const { bones, armature } = buildBonesFromCreateGroups(sourceScene);
  const skeleton = new Skeleton(bones);

  const root = new Group();
  root.name = sourceScene.name || 'Model';

  if (armature) {
    root.add(armature);
  } else {
    for (const bone of bones) {
      if (!bone.parent) {
        root.add(bone);
      }
    }
  }

  root.updateMatrixWorld(true);

  const { skinnedMeshes, skippedCount } = bindMeshesRigid(sourceScene, skeleton);
  if (skinnedMeshes.length === 0) {
    throw new Error(
      skippedCount > 0
        ? 'Skin failed — no parts could be bound to bones'
        : 'Skin failed — no meshes produced',
    );
  }

  for (const mesh of skinnedMeshes) {
    root.add(mesh);
  }

  return root;
}
