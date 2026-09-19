import type { Object3D } from 'three';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { listCreatedPartEntries, listCreatedParts } from '../list-created-parts';
import { ARMATURE_GROUP_NAME } from './build-bones-from-create-groups';

export interface SkinModelAvailability {
  enabled: boolean;
  /** Tooltip / menu title: why Skin is available or disabled. */
  reason: string;
}

function sceneHasUsableSkeleton(scene: Object3D): boolean {
  let hasSkinnedMesh = false;
  let hasSkeleton = false;

  scene.traverse((child) => {
    const skinned = child as { isSkinnedMesh?: boolean; skeleton?: unknown };
    if (!skinned.isSkinnedMesh) {
      return;
    }
    hasSkinnedMesh = true;
    if (skinned.skeleton) {
      hasSkeleton = true;
    }
  });

  return hasSkinnedMesh && hasSkeleton;
}

/** Create groups that become skeleton bones (`Armature` is a container only). */
function countBoneCreateGroups(scene: Object3D): number {
  return listCreatedPartEntries(scene).filter(
    (entry) => entry.isGroup && entry.object.name !== ARMATURE_GROUP_NAME,
  ).length;
}

/**
 * Whether **Skin model** is available for a library entry.
 * Prerequisites: created source, ≥1 bone create group, ≥1 stamped part, not already skinned.
 */
export function canSkinModel(model: ModelEntry): SkinModelAvailability {
  if (sceneHasUsableSkeleton(model.scene)) {
    return { enabled: false, reason: 'Already skinned' };
  }

  if (model.source !== 'created') {
    return { enabled: false, reason: 'Skin works on created models' };
  }

  if (countBoneCreateGroups(model.scene) === 0) {
    return { enabled: false, reason: 'Add create groups before skinning' };
  }

  if (listCreatedParts(model.scene).length === 0) {
    return { enabled: false, reason: 'Add parts before skinning' };
  }

  return {
    enabled: true,
    reason: 'Convert create groups into a skeleton',
  };
}
