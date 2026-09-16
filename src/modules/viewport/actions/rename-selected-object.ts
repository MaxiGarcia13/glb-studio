import { renameNodeInClipTracks } from '@/modules/animation/domain/rename-node-tracks';
import { renameBindPoseNode } from '@/modules/animation/stores/bind-pose-store';
import { $clips, syncClipsToSkeleton } from '@/modules/animation/stores/clip-store';
import { findModelOwningObject, isNodeNameTaken } from '../domain/node-name';
import { $model } from '../stores/model-store';
import { $selection } from '../stores/selection-store';

/**
 * Rename the selected Object3D. Remaps owned clip tracks + bind-pose keys for
 * the owning model. Shared clips are left unchanged.
 */
export function renameSelectedObject(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }

  const object = $selection.get().object;
  if (!object) {
    return;
  }

  const previous = object.name;
  if (trimmed === previous) {
    return;
  }

  const model = findModelOwningObject($model.get().models, object);
  if (!model) {
    return;
  }

  if (isNodeNameTaken(model.scene, trimmed, object)) {
    return;
  }

  object.name = trimmed;

  if (previous) {
    remapOwnedClips(model.id, previous, trimmed);
    renameBindPoseNode(model.id, previous, trimmed);
  }

  syncClipsToSkeleton(model.scene);
  // Force overlay / Settings subscribers to re-read `object.name`.
  $selection.setKey('object', object);
}

function remapOwnedClips(modelId: string, fromName: string, toName: string): void {
  const state = $clips.get();
  let changed = false;
  const clips = state.clips.map((entry) => {
    if (entry.ownerModelId !== modelId || !entry.clip) {
      return entry;
    }

    const clip = renameNodeInClipTracks(entry.clip, fromName, toName);
    const sourceClip
      = entry.sourceClip && entry.sourceClip !== entry.clip
        ? renameNodeInClipTracks(entry.sourceClip, fromName, toName)
        : clip;

    if (clip === entry.clip && sourceClip === entry.sourceClip) {
      return entry;
    }

    changed = true;
    return { ...entry, clip, sourceClip };
  });

  if (changed) {
    $clips.set({ ...state, clips });
  }
}
