import { Modal } from '@/components/modal';
import { useSelectedCreatedPart } from '@/modules/create/hooks/use-selected-created-part';
import { findMeshStandardMaterial } from '@/modules/create/utils/selected-part';
import { TexturePartPreview } from './texture-part-preview';
import { TexturePrepActions } from './texture-prep-actions';
import { TexturePrepBgRemove } from './texture-prep-bg-remove';
import { TexturePrepMessages } from './texture-prep-messages';
import { TexturePrepSourceStrip } from './texture-prep-source-strip';
import { TexturePrepTransformControls } from './texture-prep-transform-controls';
import { TexturePrepWrapControls } from './texture-prep-wrap-controls';
import { useTexturePrepDraft } from './use-texture-prep-draft';

interface TexturePrepModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired after a draft is committed to the live part material. */
  onApplied?: () => void;
}

/**
 * Prep modal for created-part color maps (US-39). Choose / replace, crop /
 * flip, wrap, opt-in background remove; Apply commits, Cancel disposes draft.
 */
export function TexturePrepModal({
  open,
  onClose,
  onApplied,
}: TexturePrepModalProps) {
  const part = useSelectedCreatedPart();
  const material = part ? findMeshStandardMaterial(part.mesh) : null;
  const partId = part?.mesh.uuid ?? null;

  const {
    draftTexture,
    sourceName,
    thumbUrl,
    error,
    warnings,
    busy,
    canCropToSquare,
    canApply,
    wrapPreset,
    pickFile,
    flipX,
    flipY,
    cropToSquare,
    setWrapPreset,
    removeBackground,
    apply,
    close,
  } = useTexturePrepDraft({
    open,
    partId,
    seededMap: material?.map ?? null,
    onClose,
  });

  if (!part) {
    return null;
  }

  const kindLabel = part.kind.label;
  const previewTexture = draftTexture ?? material?.map ?? null;
  const displayName = sourceName ?? previewTexture?.name ?? null;
  const hasSource = Boolean(previewTexture);

  return (
    <Modal
      open={open}
      title={`Texture — ${kindLabel}`}
      onClose={close}
      className="max-w-4xl h-[min(90vh,42rem)]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row h-[min(70vh,32rem)]">
          <div className="flex max-h-48 w-full shrink-0 flex-col gap-4 overflow-y-auto sm:max-h-none sm:w-56 px-1">
            <TexturePrepSourceStrip
              displayName={displayName}
              thumbUrl={thumbUrl}
              hasSource={hasSource}
              busy={busy}
              onPickFile={(file) => {
                void pickFile(file);
              }}
            />
            <TexturePrepTransformControls
              enabled={hasSource}
              busy={busy}
              canCropToSquare={canCropToSquare}
              onFlipX={() => {
                void flipX();
              }}
              onFlipY={() => {
                void flipY();
              }}
              onCropToSquare={() => {
                void cropToSquare();
              }}
            />
            <TexturePrepWrapControls
              enabled={hasSource}
              busy={busy}
              value={wrapPreset}
              onChange={setWrapPreset}
            />
            <TexturePrepBgRemove
              enabled={hasSource}
              busy={busy}
              onRemoveBackground={() => {
                void removeBackground();
              }}
            />
            <TexturePrepMessages error={error} warnings={warnings} />
          </div>

          <div
            className="min-h-48 min-w-0 flex-1 overflow-hidden rounded-sm border border-border bg-canvas sm:min-h-0"
            aria-label={`Texture preview for ${kindLabel}`}
          >
            <TexturePartPreview
              key={part.mesh.uuid}
              kindId={part.record.kind}
              params={part.record.params}
              color={material?.color}
              draftTexture={previewTexture}
              wrapPreset={wrapPreset}
            />
          </div>
        </div>

        <TexturePrepActions
          onCancel={close}
          canApply={canApply && Boolean(material)}
          onApply={() => {
            if (!material) {
              return;
            }
            if (apply(material)) {
              onApplied?.();
            }
          }}
        />
      </div>
    </Modal>
  );
}
