import type { TexturePrepDraft, UseTexturePrepDraftArgs } from './types';
import { createApplyDraft } from './apply-draft';
import { createPickFile } from './pick-file';
import { createRemoveBackground } from './remove-background';
import { createTransformActions } from './transform-actions';
import { useOwnedDraft } from './use-owned-draft';
import { useTexturePrepLifecycle } from './use-texture-prep-lifecycle';
import { createSetWrapPreset } from './wrap-actions';

/**
 * Owns file-picked / transformed draft textures + thumbnail for the prep modal.
 * Never disposes the live part map (seeded read-through only).
 * Apply transfers draft ownership to the part material.
 */
export function useTexturePrepDraft({
  open,
  partId,
  seededMap,
  onClose,
}: UseTexturePrepDraftArgs): TexturePrepDraft {
  const owned = useOwnedDraft(seededMap);
  const { close } = useTexturePrepLifecycle({
    open,
    partId,
    onClose,
    owned,
  });
  const pickFile = createPickFile(owned);
  const { flipX, flipY, cropToRegion } = createTransformActions(owned);
  const applyWrapPreset = createSetWrapPreset(owned);
  const removeBackground = createRemoveBackground(owned);
  const apply = createApplyDraft(owned, close);

  const canApply = Boolean(owned.draftTexture) && !owned.busy;

  return {
    draftTexture: owned.draftTexture,
    sourceName: owned.sourceName,
    thumbUrl: owned.thumbUrl,
    error: owned.error,
    warnings: owned.warnings,
    busy: owned.busy,
    canApply,
    wrapPreset: owned.wrapPreset,
    pickFile,
    flipX,
    flipY,
    cropToRegion,
    setWrapPreset: applyWrapPreset,
    removeBackground,
    apply,
    close,
  };
}
