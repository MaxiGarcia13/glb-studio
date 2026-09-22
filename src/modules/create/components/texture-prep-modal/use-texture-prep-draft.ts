import type { Texture } from 'three';
import type { ImageTextureTransform } from '@/modules/create/adapters/transform-image-texture';
import type { TextureWrapPresetId } from '@/modules/create/domain/texture-wrap-preset';
import { useEffect, useRef, useState } from 'react';
import {
  dataUrlFromCanvas,
  ImageTextureError,
  loadImageTexture,
} from '@/modules/create/adapters/load-image-texture';
import { transformImageTexture } from '@/modules/create/adapters/transform-image-texture';
import {
  centerSquareCrop,
  isAlreadySquare,
} from '@/modules/create/domain/texture-crop';
import { texturePrepSoftWarnings } from '@/modules/create/domain/texture-prep-guidance';
import {
  applyTextureWrapPreset,
  inferTextureWrapPreset,
} from '@/modules/create/domain/texture-wrap-preset';
import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { bitmapSize } from './bitmap-size';

interface UseTexturePrepDraftArgs {
  open: boolean;
  partId: string | null;
  seededMap: Texture | null;
  onClose: () => void;
}

export interface TexturePrepDraft {
  draftTexture: Texture | null;
  sourceName: string | null;
  thumbUrl: string | null;
  error: string | null;
  warnings: string[];
  busy: boolean;
  canCropToSquare: boolean;
  wrapPreset: TextureWrapPresetId;
  pickFile: (file: File | undefined) => Promise<void>;
  flipX: () => Promise<void>;
  flipY: () => Promise<void>;
  cropToSquare: () => Promise<void>;
  setWrapPreset: (preset: TextureWrapPresetId) => void;
  close: () => void;
}

function revokeThumbUrl(url: string | null): void {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [draftTexture, setDraftTexture] = useState<Texture | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [wrapPreset, setWrapPresetState]
    = useState<TextureWrapPresetId>('clamp');

  const draftTextureRef = useRef<Texture | null>(null);
  const thumbUrlRef = useRef<string | null>(null);
  const seededMapRef = useRef(seededMap);
  const wrapPresetRef = useRef<TextureWrapPresetId>('clamp');
  draftTextureRef.current = draftTexture;
  thumbUrlRef.current = thumbUrl;
  seededMapRef.current = seededMap;
  wrapPresetRef.current = wrapPreset;

  const workingTexture = (): Texture | null =>
    draftTextureRef.current ?? seededMapRef.current;

  const clearOwnedDraftResources = () => {
    disposeImageTexture(draftTextureRef.current);
    draftTextureRef.current = null;
    revokeThumbUrl(thumbUrlRef.current);
    thumbUrlRef.current = null;
  };

  const resetOwnedDraftState = () => {
    clearOwnedDraftResources();
    setDraftTexture(null);
    setThumbUrl(null);
    setSourceName(null);
    setWarnings([]);
    wrapPresetRef.current = 'clamp';
    setWrapPresetState('clamp');
  };

  const close = () => {
    resetOwnedDraftState();
    setError(null);
    setBusy(false);
    onCloseRef.current();
  };

  useEffect(() => {
    if (open && !partId) {
      resetOwnedDraftState();
      setError(null);
      setBusy(false);
      onCloseRef.current();
    }
  }, [open, partId]);

  useEffect(() => {
    if (!open || !partId) {
      return;
    }
    setError(null);
    setBusy(false);
    clearOwnedDraftResources();
    setDraftTexture(null);
    setThumbUrl(null);

    const seeded = seededMapRef.current;
    setSourceName(seeded?.name || null);
    const size = seeded ? bitmapSize(seeded) : null;
    setWarnings(size ? texturePrepSoftWarnings(size.width, size.height) : []);
    const preset = seeded ? inferTextureWrapPreset(seeded) : 'clamp';
    wrapPresetRef.current = preset;
    setWrapPresetState(preset);
  }, [open, partId]);

  useEffect(() => {
    return () => {
      clearOwnedDraftResources();
    };
  }, []);

  const setOwnedDraft = (
    texture: Texture,
    nextThumbUrl: string | null,
    name: string | null,
  ) => {
    applyTextureWrapPreset(texture, wrapPresetRef.current);
    draftTextureRef.current = texture;
    setDraftTexture(texture);
    if (name) {
      setSourceName(name);
    }
    revokeThumbUrl(thumbUrlRef.current);
    thumbUrlRef.current = nextThumbUrl;
    setThumbUrl(nextThumbUrl);

    const size = bitmapSize(texture);
    setWarnings(
      size ? texturePrepSoftWarnings(size.width, size.height) : [],
    );
  };

  /**
   * Wrap mutates GPU texture state. Clone a seeded live map first so Cancel
   * never leaves wrap/repeat changes on the real part.
   */
  const ensureOwnedDraft = (): Texture | null => {
    if (draftTextureRef.current) {
      return draftTextureRef.current;
    }
    const seeded = seededMapRef.current;
    if (!seeded) {
      return null;
    }
    const clone = seeded.clone();
    clone.needsUpdate = true;
    setOwnedDraft(clone, thumbUrlRef.current, clone.name || null);
    return clone;
  };

  const pickFile = async (file: File | undefined) => {
    if (!file || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const texture = await loadImageTexture(file, draftTextureRef.current);
      const canvas = texture.image as HTMLCanvasElement | undefined;
      const nextThumb
        = canvas && typeof canvas.toDataURL === 'function'
          ? dataUrlFromCanvas(canvas)
          : null;
      setOwnedDraft(texture, nextThumb, file.name);
    } catch (cause) {
      if (cause instanceof ImageTextureError) {
        setError(cause.message);
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError(`Could not load “${file.name}”.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const applyTransform = async (transform: ImageTextureTransform) => {
    const source = workingTexture();
    if (!source || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { texture, thumbUrl: nextThumb } = await transformImageTexture(
        source,
        transform,
        draftTextureRef.current,
      );
      setOwnedDraft(texture, nextThumb, texture.name || null);
    } catch (cause) {
      if (cause instanceof ImageTextureError) {
        setError(cause.message);
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError('Could not transform this image.');
      }
    } finally {
      setBusy(false);
    }
  };

  const flipX = () => applyTransform({ flipX: true });
  const flipY = () => applyTransform({ flipY: true });

  const cropToSquare = async () => {
    const source = workingTexture();
    if (!source || busy) {
      return;
    }
    const size = bitmapSize(source);
    if (!size || isAlreadySquare(size.width, size.height)) {
      return;
    }
    await applyTransform({ crop: centerSquareCrop(size.width, size.height) });
  };

  const setWrapPreset = (preset: TextureWrapPresetId) => {
    if (busy) {
      return;
    }
    wrapPresetRef.current = preset;
    setWrapPresetState(preset);
    const texture = ensureOwnedDraft();
    if (!texture) {
      return;
    }
    applyTextureWrapPreset(texture, preset);
  };

  const previewSize = bitmapSize(draftTexture ?? seededMap);
  const canCropToSquare = Boolean(
    previewSize && !isAlreadySquare(previewSize.width, previewSize.height),
  );

  return {
    draftTexture,
    sourceName,
    thumbUrl,
    error,
    warnings,
    busy,
    canCropToSquare,
    wrapPreset,
    pickFile,
    flipX,
    flipY,
    cropToSquare,
    setWrapPreset,
    close,
  };
}
