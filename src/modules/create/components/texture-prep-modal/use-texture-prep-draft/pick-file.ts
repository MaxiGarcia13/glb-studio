import type { OwnedDraft } from './use-owned-draft';
import {
  dataUrlFromCanvas,
  ImageTextureError,
  loadImageTexture,
} from '@/modules/create/adapters/load-image-texture';

/** File pick → owned draft texture (US-28 decode path). */
export function createPickFile(
  owned: OwnedDraft,
): (file: File | undefined) => Promise<void> {
  return async (file: File | undefined) => {
    if (!file || owned.busy) {
      return;
    }
    owned.setBusy(true);
    owned.setError(null);
    try {
      const texture = await loadImageTexture(
        file,
        owned.draftTextureRef.current,
      );
      const canvas = texture.image as HTMLCanvasElement | undefined;
      const nextThumb
        = canvas && typeof canvas.toDataURL === 'function'
          ? dataUrlFromCanvas(canvas)
          : null;
      owned.setOwnedDraft(texture, nextThumb, file.name);
    } catch (cause) {
      if (cause instanceof ImageTextureError) {
        owned.setError(cause.message);
      } else if (cause instanceof Error) {
        owned.setError(cause.message);
      } else {
        owned.setError(`Could not load “${file.name}”.`);
      }
    } finally {
      owned.setBusy(false);
    }
  };
}
