import { Modal } from '@/components/modal';
import { useSelectedCreatedPart } from '@/modules/create/hooks/use-selected-created-part';
import { findMeshStandardMaterial } from '@/modules/create/utils/selected-part';
import { TexturePartPreview } from './texture-part-preview';
import { TexturePrepActions } from './texture-prep-actions';
import { TexturePrepMessages } from './texture-prep-messages';
import { TexturePrepSourceStrip } from './texture-prep-source-strip';
import { useTexturePrepDraft } from './use-texture-prep-draft';

interface TexturePrepModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Prep modal for created-part color maps (US-39). Choose / replace uses the
 * US-28 decode path; crop / wrap / bg-remove / Apply commit follow later.
 */
export function TexturePrepModal({ open, onClose }: TexturePrepModalProps) {
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
    pickFile,
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
        <div
          className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border bg-canvas"
          aria-label={`Texture preview for ${kindLabel}`}
        >
          <TexturePartPreview
            key={part.mesh.uuid}
            kindId={part.record.kind}
            params={part.record.params}
            color={material?.color}
            draftTexture={previewTexture}
          />
        </div>

        <div className="flex flex-col gap-4 shrink-0">
          <TexturePrepSourceStrip
            displayName={displayName}
            thumbUrl={thumbUrl}
            hasSource={hasSource}
            busy={busy}
            onPickFile={(file) => {
              void pickFile(file);
            }}
          />
          <TexturePrepMessages error={error} warnings={warnings} />
        </div>

        <TexturePrepActions onCancel={close} />
      </div>
    </Modal>
  );
}
