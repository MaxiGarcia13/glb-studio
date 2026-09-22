import { useEffect } from 'react';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';
import { findMeshStandardMaterial } from '../utils/selected-part';
import { TexturePartPreview } from './texture-part-preview';

interface TexturePrepModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Prep shell for created-part color maps (US-39). Image pick, crop / wrap /
 * bg-remove land in follow-up tasks; Apply stays disabled until a draft can
 * commit. Preview shows the part with the current map as a read-through draft.
 */
export function TexturePrepModal({ open, onClose }: TexturePrepModalProps) {
  const part = useSelectedCreatedPart();
  const material = part ? findMeshStandardMaterial(part.mesh) : null;

  useEffect(() => {
    if (open && !part) {
      onClose();
    }
  }, [open, part, onClose]);

  if (!part) {
    return null;
  }

  const kindLabel = part.kind.label;

  return (
    <Modal
      open={open}
      title={`Texture — ${kindLabel}`}
      onClose={onClose}
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
            draftTexture={material?.map ?? null}
          />
        </div>

        <div className="flex shrink-0 justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled
            title="Choose an image before applying"
          >
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}
