import type { MeshStandardMaterial } from 'three';
import type { OwnedDraft } from './use-owned-draft';
import { replaceColorMap } from '@/modules/create/domain/material-color-map';
import { revokeThumbUrl } from './revoke-thumb-url';

/**
 * Relinquish draft ownership (without disposing), commit onto the live part,
 * then close. Cancel/close paths still dispose any remaining owned draft.
 */
export function createApplyDraft(
  owned: OwnedDraft,
  close: () => void,
): (material: MeshStandardMaterial) => boolean {
  return (material) => {
    const draft = owned.draftTextureRef.current;
    if (!draft || owned.busy) {
      return false;
    }

    // Transfer ownership to the material — do not dispose on close.
    owned.draftTextureRef.current = null;
    owned.setDraftTexture(null);
    revokeThumbUrl(owned.thumbUrlRef.current);
    owned.thumbUrlRef.current = null;
    owned.setThumbUrl(null);

    replaceColorMap(material, draft);
    close();
    return true;
  };
}
