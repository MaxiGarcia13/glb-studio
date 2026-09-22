import type { Texture } from 'three';
import { useEffect, useRef, useState } from 'react';
import {
  ImageTextureError,
  loadImageTexture,
} from '@/modules/create/adapters/load-image-texture';
import { texturePrepSoftWarnings } from '@/modules/create/domain/texture-prep-guidance';
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
  pickFile: (file: File | undefined) => Promise<void>;
  close: () => void;
}

/**
 * Owns file-picked draft textures + thumbnail URL for the prep modal.
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

  const draftTextureRef = useRef<Texture | null>(null);
  const thumbUrlRef = useRef<string | null>(null);
  const seededMapRef = useRef(seededMap);
  draftTextureRef.current = draftTexture;
  thumbUrlRef.current = thumbUrl;
  seededMapRef.current = seededMap;

  const clearOwnedDraftResources = () => {
    disposeImageTexture(draftTextureRef.current);
    draftTextureRef.current = null;
    if (thumbUrlRef.current) {
      URL.revokeObjectURL(thumbUrlRef.current);
      thumbUrlRef.current = null;
    }
  };

  const resetOwnedDraftState = () => {
    clearOwnedDraftResources();
    setDraftTexture(null);
    setThumbUrl(null);
    setSourceName(null);
    setWarnings([]);
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
  }, [open, partId]);

  useEffect(() => {
    return () => {
      clearOwnedDraftResources();
    };
  }, []);

  const pickFile = async (file: File | undefined) => {
    if (!file || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const texture = await loadImageTexture(file, draftTextureRef.current);
      draftTextureRef.current = texture;
      setDraftTexture(texture);
      setSourceName(file.name);

      if (thumbUrlRef.current) {
        URL.revokeObjectURL(thumbUrlRef.current);
      }
      const nextThumb = URL.createObjectURL(file);
      thumbUrlRef.current = nextThumb;
      setThumbUrl(nextThumb);

      const size = bitmapSize(texture);
      setWarnings(
        size ? texturePrepSoftWarnings(size.width, size.height) : [],
      );
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

  return {
    draftTexture,
    sourceName,
    thumbUrl,
    error,
    warnings,
    busy,
    pickFile,
    close,
  };
}
