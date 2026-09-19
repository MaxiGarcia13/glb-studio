import type { ClipEntry } from '@/modules/animation/types/clip';

/** Shared clips that ship as animation-only files (owned never leave their model file). */
export function sharedAnimationOnlyClips(
  clips: readonly ClipEntry[],
): ClipEntry[] {
  return clips.filter(
    (entry) => entry.clip !== null && entry.ownerModelId === null,
  );
}
