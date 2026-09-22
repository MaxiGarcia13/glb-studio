import type { OwnedDraft } from './use-owned-draft';
import { useEffect, useRef } from 'react';
import { texturePrepSoftWarnings } from '@/modules/create/domain/texture-prep-guidance';
import { inferTextureWrapPreset } from '@/modules/create/domain/texture-wrap-preset';
import { bitmapSize } from './bitmap-size';

interface UseTexturePrepLifecycleArgs {
  open: boolean;
  partId: string | null;
  onClose: () => void;
  owned: OwnedDraft;
}

/** Open / part-change reset, unmount dispose, and Cancel close. */
export function useTexturePrepLifecycle({
  open,
  partId,
  onClose,
  owned,
}: UseTexturePrepLifecycleArgs): { close: () => void } {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const ownedRef = useRef(owned);
  ownedRef.current = owned;

  const close = () => {
    const current = ownedRef.current;
    current.resetOwnedDraftState();
    current.setError(null);
    current.setBusy(false);
    onCloseRef.current();
  };

  useEffect(() => {
    if (open && !partId) {
      const current = ownedRef.current;
      current.resetOwnedDraftState();
      current.setError(null);
      current.setBusy(false);
      onCloseRef.current();
    }
  }, [open, partId]);

  useEffect(() => {
    if (!open || !partId) {
      return;
    }
    const current = ownedRef.current;
    current.setError(null);
    current.setBusy(false);
    current.clearOwnedDraftResources();
    current.setDraftTexture(null);
    current.setThumbUrl(null);

    const seeded = current.seededMapRef.current;
    current.setSourceName(seeded?.name || null);
    const size = seeded ? bitmapSize(seeded) : null;
    current.setWarnings(
      size ? texturePrepSoftWarnings(size.width, size.height) : [],
    );
    const preset = seeded ? inferTextureWrapPreset(seeded) : 'clamp';
    current.wrapPresetRef.current = preset;
    current.setWrapPreset(preset);
  }, [open, partId]);

  useEffect(() => {
    return () => {
      ownedRef.current.clearOwnedDraftResources();
    };
  }, []);

  return { close };
}
