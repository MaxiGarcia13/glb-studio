import type { ClipEntry } from '@/modules/animation/types/clip';

import { findReadyOwnedClipNamed } from './clip-conflict';

/**
 * Clip id that should drive a model's mixer.
 * Explicit per-model owned selection wins; otherwise a selected shared clip,
 * with a same-name ready owned override when that model already has one.
 */
export function resolveActiveClipIdForModel(
  clips: ClipEntry[],
  modelId: string,
  activeClipByModelId: Record<string, string | null>,
  activeSharedClipId: string | null,
): string | null {
  const ownedSelection = activeClipByModelId[modelId];
  if (ownedSelection) {
    return ownedSelection;
  }

  if (!activeSharedClipId) {
    return null;
  }

  const shared = clips.find((entry) => entry.id === activeSharedClipId);
  if (!shared) {
    return activeSharedClipId;
  }

  return findReadyOwnedClipNamed(clips, modelId, shared.name)?.id
    ?? activeSharedClipId;
}
