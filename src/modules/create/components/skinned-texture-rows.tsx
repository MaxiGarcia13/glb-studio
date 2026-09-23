import type { Group } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useRef, useState } from 'react';
import { AssetEntry } from '@/components/asset-entry';
import { TextureIcon } from '@/components/icons/texture-icon';
import { Text } from '@/components/text';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { applySkinnedSessionSkinFromFile } from '../actions/apply-skinned-session-skin';
import {
  pickNoSessionSkin,
  pickSessionSkin,
} from '../actions/pick-session-skin';
import { removeSessionSkin } from '../actions/remove-session-skin';
import {
  ImageTextureError,
  PART_COLOR_MAP_ACCEPT,
} from '../adapters/load-image-texture';
import { resolveSkinnedTextureTarget } from '../domain/resolve-skinned-texture-target';
import { $materialMapsRevision } from '../stores/material-maps-revision-store';
import {
  $sessionSkinsByModel,
  getSessionSkinWardrobe,
} from '../stores/session-skins-store';

interface SkinnedTextureRowsProps {
  modelId: string;
  scene: Group;
  className?: string;
}

/**
 * Library session skin rows for a skinned model (US-48).
 * One row per wardrobe entry (selected = active) plus an explicit “No skin” row.
 * File replace / apply still appends via the US-40 path.
 */
export function SkinnedTextureRows({
  modelId,
  scene,
  className,
}: SkinnedTextureRowsProps) {
  useStore($materialMapsRevision);
  useStore($sessionSkinsByModel);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const wardrobe = getSessionSkinWardrobe(modelId);
  const target = resolveSkinnedTextureTarget(scene, selected);
  const canApply = target !== null;

  function handlePickSkin(skinId: string) {
    if (busy) {
      return;
    }
    setError(null);
    if (!pickSessionSkin({ modelId, skinId, scene, selected })) {
      setError('Select a skinned mesh to apply this skin');
    }
  }

  function handlePickNone() {
    if (busy) {
      return;
    }
    setError(null);
    if (!pickNoSessionSkin({ modelId, scene, selected })) {
      setError('Select a skinned mesh to clear the skin');
    }
  }

  function handleRemoveSkin(skinId: string) {
    if (busy) {
      return;
    }
    setError(null);
    removeSessionSkin({ modelId, skinId, scene, selected });
  }

  function handleApplyFile() {
    if (busy || !canApply) {
      return;
    }
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !target) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await applySkinnedSessionSkinFromFile({
        modelId,
        meshUuid: target.mesh.uuid,
        material: target.material,
        file,
      });
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
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={PART_COLOR_MAP_ACCEPT}
        aria-hidden
        tabIndex={-1}
        className="sr-only"
        disabled={busy || !canApply}
        onChange={handleFileChange}
      />
      <AssetEntry
        leading={<TextureIcon />}
        label="No skin"
        title="No skin"
        selected={wardrobe.activeSkinId === null}
        replaceDisabled={busy || !canApply}
        onSelect={handlePickNone}
        onReplace={handleApplyFile}
        onRemove={handlePickNone}
      />
      {wardrobe.skins.map((entry) => (
        <AssetEntry
          key={entry.id}
          leading={<TextureIcon />}
          label={entry.label}
          title={entry.label}
          selected={wardrobe.activeSkinId === entry.id}
          replaceDisabled={busy || !canApply}
          onSelect={() => handlePickSkin(entry.id)}
          onReplace={handleApplyFile}
          onRemove={() => handleRemoveSkin(entry.id)}
        />
      ))}
      {error
        ? (
            <Text size="sm" variant="error" role="alert">
              {error}
            </Text>
          )
        : null}
    </div>
  );
}
