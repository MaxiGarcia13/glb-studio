import type { OwnedDraft } from './use-owned-draft';
import type { ImageTextureTransform } from '@/modules/create/adapters/transform-image-texture';
import { ImageTextureError } from '@/modules/create/adapters/load-image-texture';
import { transformImageTexture } from '@/modules/create/adapters/transform-image-texture';
import {
  centerSquareCrop,
  isAlreadySquare,
} from '@/modules/create/domain/texture-crop';
import { bitmapSize } from './bitmap-size';

export interface TexturePrepTransformActions {
  flipX: () => Promise<void>;
  flipY: () => Promise<void>;
  cropToSquare: () => Promise<void>;
}

/** Crop + flip against the working (draft or seeded) texture. */
export function createTransformActions(
  owned: OwnedDraft,
): TexturePrepTransformActions {
  const applyTransform = async (transform: ImageTextureTransform) => {
    const source = owned.workingTexture();
    if (!source || owned.busy) {
      return;
    }
    owned.setBusy(true);
    owned.setError(null);
    try {
      const { texture, thumbUrl: nextThumb } = await transformImageTexture(
        source,
        transform,
        owned.draftTextureRef.current,
      );
      owned.setOwnedDraft(texture, nextThumb, texture.name || null);
    } catch (cause) {
      if (cause instanceof ImageTextureError) {
        owned.setError(cause.message);
      } else if (cause instanceof Error) {
        owned.setError(cause.message);
      } else {
        owned.setError('Could not transform this image.');
      }
    } finally {
      owned.setBusy(false);
    }
  };

  return {
    flipX: () => applyTransform({ flipX: true }),
    flipY: () => applyTransform({ flipY: true }),
    cropToSquare: async () => {
      const source = owned.workingTexture();
      if (!source || owned.busy) {
        return;
      }
      const size = bitmapSize(source);
      if (!size || isAlreadySquare(size.width, size.height)) {
        return;
      }
      await applyTransform({
        crop: centerSquareCrop(size.width, size.height),
      });
    },
  };
}
