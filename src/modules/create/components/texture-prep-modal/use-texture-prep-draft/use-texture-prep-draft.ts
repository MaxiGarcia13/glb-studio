import type { TexturePrepDraft, UseTexturePrepDraftArgs } from './types';
import { isAlreadySquare } from '@/modules/create/domain/texture-crop';
import { bitmapSize } from './bitmap-size';
import { createPickFile } from './pick-file';
import { createTransformActions } from './transform-actions';
import { useOwnedDraft } from './use-owned-draft';
import { useTexturePrepLifecycle } from './use-texture-prep-lifecycle';
import { createSetWrapPreset } from './wrap-actions';

/**
 * Owns file-picked / transformed draft textures + thumbnail for the prep modal.
 * Never disposes the live part map (seeded read-through only).
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
  const { flipX, flipY, cropToSquare } = createTransformActions(owned);
  const applyWrapPreset = createSetWrapPreset(owned);

  const previewSize = bitmapSize(owned.draftTexture ?? seededMap);
  const canCropToSquare = Boolean(
    previewSize && !isAlreadySquare(previewSize.width, previewSize.height),
  );

  return {
    draftTexture: owned.draftTexture,
    sourceName: owned.sourceName,
    thumbUrl: owned.thumbUrl,
    error: owned.error,
    warnings: owned.warnings,
    busy: owned.busy,
    canCropToSquare,
    wrapPreset: owned.wrapPreset,
    pickFile,
    flipX,
    flipY,
    cropToSquare,
    setWrapPreset: applyWrapPreset,
    close,
  };
}
