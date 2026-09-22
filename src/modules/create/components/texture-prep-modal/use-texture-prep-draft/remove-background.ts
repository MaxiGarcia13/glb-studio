import type { OwnedDraft } from './use-owned-draft';
import { ImageTextureError } from '@/modules/create/adapters/load-image-texture';
import { removeImageBackground } from '@/modules/create/adapters/remove-image-background';

/** Opt-in client WASM background removal → alpha draft. */
export function createRemoveBackground(
  owned: OwnedDraft,
): () => Promise<void> {
  return async () => {
    const source = owned.workingTexture();
    if (!source || owned.busy) {
      return;
    }
    owned.setBusy(true);
    owned.setError(null);
    try {
      const { texture, thumbUrl: nextThumb } = await removeImageBackground(
        source,
        owned.draftTextureRef.current,
      );
      owned.setOwnedDraft(texture, nextThumb, texture.name || null);
    } catch (cause) {
      if (cause instanceof ImageTextureError) {
        owned.setError(cause.message);
      } else if (cause instanceof Error) {
        owned.setError(cause.message);
      } else {
        owned.setError('Could not remove the background.');
      }
    } finally {
      owned.setBusy(false);
    }
  };
}
