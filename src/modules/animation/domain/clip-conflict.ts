import type { ClipEntry } from '@/modules/animation/types/clip';

/** True when the model already owns a playable clip with this display name. */
export function modelHasReadyOwnedClipNamed(
  clips: ClipEntry[],
  modelId: string,
  name: string,
): boolean {
  return clips.some(
    (entry) =>
      entry.ownerModelId === modelId
      && entry.name === name
      && entry.status === 'ready'
      && entry.clip !== null,
  );
}
