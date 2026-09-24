import type { Mesh, MeshStandardMaterial } from 'three';
import { useStore } from '@nanostores/react';
import { useRef, useState } from 'react';
import { AssetEntry } from '@/components/asset-entry';
import { TextureIcon } from '@/components/icons/texture-icon';
import { Text } from '@/components/text';
import { setEditTool } from '@/modules/viewport/stores/edit-tool-store';
import { $model, selectModel } from '@/modules/viewport/stores/model-store';
import { $selection, selectObject } from '@/modules/viewport/stores/selection-store';
import { commitMaterialColorMapChange } from '../actions/commit-material-color-map';
import {
  ImageTextureError,
  loadImageTexture,
  PART_COLOR_MAP_ACCEPT,
} from '../adapters/load-image-texture';

interface PartTextureRowProps {
  modelId: string;
  mesh: Mesh;
  material: MeshStandardMaterial;
  label: string;
}

/**
 * Nested Library row for a created part’s current color map.
 * Clear / replace use the same `materialColorMap` undo path as the prep modal.
 */
export function PartTextureRow({
  modelId,
  mesh,
  material,
  label,
}: PartTextureRowProps) {
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function focusPart() {
    if ($model.get().activeModelId !== modelId) {
      selectModel(modelId);
    }
    setEditTool('edit');
    selectObject(mesh);
  }

  function handleClear() {
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

  function handleReplace() {
    if (busy) {
      return;
    }
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const texture = await loadImageTexture(file);
      commitMaterialColorMapChange({
        modelId,
        meshUuid: mesh.uuid,
        material,
        next: texture,
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
    <div className="flex flex-col gap-2">
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
      <AssetEntry
        leading={<TextureIcon />}
        label={label}
        title={label}
        selected={selected === mesh}
        replaceDisabled={busy}
        onSelect={focusPart}
        onReplace={handleReplace}
        onRemove={handleClear}
      />
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
