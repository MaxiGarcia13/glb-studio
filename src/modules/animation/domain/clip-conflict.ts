import type { ClipEntry } from '@/modules/animation/types/clip';

/** Ready owned clip with this display name, if any. */
export function findReadyOwnedClipNamed(
  clips: ClipEntry[],
  modelId: string,
  name: string,
): ClipEntry | undefined {
  return clips.find(
    (entry) =>
      entry.ownerModelId === modelId
      && entry.name === name
      && entry.status === 'ready'
      && entry.clip !== null,
  );
}

/** True when the model already owns a playable clip with this display name. */
export function modelHasReadyOwnedClipNamed(
  clips: ClipEntry[],
  modelId: string,
  name: string,
): boolean {
  return findReadyOwnedClipNamed(clips, modelId, name) !== undefined;
}
