import type { MutableRefObject } from 'react';
import type { Texture } from 'three';
import type { TextureWrapPresetId } from '@/modules/create/domain/color-map/texture-wrap-preset';
import { useRef, useState } from 'react';
import { texturePrepSoftWarnings } from '@/modules/create/domain/color-map/texture-prep-guidance';
import { applyTextureWrapPreset } from '@/modules/create/domain/color-map/texture-wrap-preset';
import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { bitmapSize } from './bitmap-size';
import { revokeThumbUrl } from './revoke-thumb-url';

/** Shared draft ownership surface for pick / transform / wrap / lifecycle. */
export interface OwnedDraft {
  draftTexture: Texture | null;
  sourceName: string | null;
  thumbUrl: string | null;
  error: string | null;
  warnings: string[];
  busy: boolean;
  wrapPreset: TextureWrapPresetId;
  draftTextureRef: MutableRefObject<Texture | null>;
  thumbUrlRef: MutableRefObject<string | null>;
  seededMapRef: MutableRefObject<Texture | null>;
  wrapPresetRef: MutableRefObject<TextureWrapPresetId>;
  setError: (error: string | null) => void;
  setBusy: (busy: boolean) => void;
  setSourceName: (name: string | null) => void;
  setWarnings: (warnings: string[]) => void;
  setDraftTexture: (texture: Texture | null) => void;
  setThumbUrl: (url: string | null) => void;
  setWrapPreset: (preset: TextureWrapPresetId) => void;
  workingTexture: () => Texture | null;
  clearOwnedDraftResources: () => void;
  resetOwnedDraftState: () => void;
  setOwnedDraft: (
    texture: Texture,
    nextThumbUrl: string | null,
    name: string | null,
  ) => void;
  ensureOwnedDraft: () => Texture | null;
}

/**
 * Owns file-picked / transformed draft textures + thumbnail.
 * Never disposes the live part map (seeded read-through only).
 */
export function useOwnedDraft(seededMap: Texture | null): OwnedDraft {
  const [draftTexture, setDraftTexture] = useState<Texture | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [wrapPreset, setWrapPreset]
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
    setWrapPreset('clamp');
  };

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

  return {
    draftTexture,
    sourceName,
    thumbUrl,
    error,
    warnings,
    busy,
    wrapPreset,
    draftTextureRef,
    thumbUrlRef,
    seededMapRef,
    wrapPresetRef,
    setError,
    setBusy,
    setSourceName,
    setWarnings,
    setDraftTexture,
    setThumbUrl,
    setWrapPreset,
    workingTexture,
    clearOwnedDraftResources,
    resetOwnedDraftState,
    setOwnedDraft,
    ensureOwnedDraft,
  };
}
