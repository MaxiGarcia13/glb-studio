import type { Group, MeshStandardMaterial, SkinnedMesh } from 'three';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useRef, useState } from 'react';
import { AssetEntry } from '@/components/asset-entry';
import { TextureIcon } from '@/components/icons/texture-icon';
import { Text } from '@/components/text';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import { applySkinnedSessionSkinFromFile } from '../actions/apply-skinned-session-skin';
import { commitMaterialColorMapChange } from '../actions/commit-material-color-map';
import {
  ImageTextureError,
  PART_COLOR_MAP_ACCEPT,
} from '../adapters/load-image-texture';
import { listTexturedSkinnedMeshes } from '../domain/list-textured-skinned-meshes';
import { $materialMapsRevision } from '../stores/material-maps-revision-store';

interface SkinnedTextureRowsProps {
  modelId: string;
  scene: Group;
  className?: string;
}

interface PendingReplace {
  mesh: SkinnedMesh;
  material: MeshStandardMaterial;
}

/**
 * Library nested rows for skinned meshes that currently have a color map.
 * Clear / replace push the same `materialColorMap` undo path as the toolbar (US-46).
 */
export function SkinnedTextureRows({
  modelId,
  scene,
  className,
}: SkinnedTextureRowsProps) {
  useStore($materialMapsRevision);
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingReplace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const entries = listTexturedSkinnedMeshes(scene);
  if (entries.length === 0) {
    return null;
  }

  function focusMesh(mesh: SkinnedMesh) {
    if ($model.get().activeModelId !== modelId) {
      selectModel(modelId);
    }
    setEditTool('edit');
    selectObject(mesh);
  }

  function handleClear(mesh: SkinnedMesh, material: MeshStandardMaterial) {
    if (!material.map || busy) {
      return;
    }
    setError(null);
    commitMaterialColorMapChange({
      modelId,
      meshUuid: mesh.uuid,
      material,
      next: null,
    });
  }

  function handleReplace(mesh: SkinnedMesh, material: MeshStandardMaterial) {
    if (busy) {
      return;
    }
    pendingRef.current = { mesh, material };
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!file || !pending) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await applySkinnedSessionSkinFromFile({
        modelId,
        meshUuid: pending.mesh.uuid,
        material: pending.material,
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
        disabled={busy}
        onChange={handleFileChange}
      />
      {entries.map((entry) => (
        <AssetEntry
          key={entry.mesh.uuid}
          leading={<TextureIcon />}
          label={entry.label}
          title={entry.label}
          selected={selected === entry.mesh}
          replaceDisabled={busy}
          onSelect={() => focusMesh(entry.mesh)}
          onReplace={() => handleReplace(entry.mesh, entry.material)}
          onRemove={() => handleClear(entry.mesh, entry.material)}
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
