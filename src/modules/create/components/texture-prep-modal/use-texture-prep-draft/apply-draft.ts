import type { MeshStandardMaterial } from 'three';
import type { OwnedDraft } from './use-owned-draft';
import { commitMaterialColorMapChange } from '@/modules/create/actions/commit-material-color-map';
import { revokeThumbUrl } from './revoke-thumb-url';

export interface ApplyDraftTarget {
  modelId: string;
  meshUuid: string;
}

/**
 * Relinquish draft ownership (without disposing), commit onto the live part
 * with undo, then close. Cancel/close paths still dispose any remaining owned draft.
 */
export function createApplyDraft(
  owned: OwnedDraft,
  close: () => void,
  resolveTarget: () => ApplyDraftTarget | null,
): (material: MeshStandardMaterial) => boolean {
  return (material) => {
    const draft = owned.draftTextureRef.current;
    const target = resolveTarget();
    if (!draft || owned.busy || !target) {
      return false;
    }

    // Transfer ownership to the material — do not dispose on close.
    owned.draftTextureRef.current = null;
    owned.setDraftTexture(null);
    revokeThumbUrl(owned.thumbUrlRef.current);
    owned.thumbUrlRef.current = null;
    owned.setThumbUrl(null);

    commitMaterialColorMapChange({
      modelId: target.modelId,
      meshUuid: target.meshUuid,
      material,
      next: draft,
    });
    close();
    return true;
  };
}
