import type { MeshStandardMaterial } from 'three';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { TextureIcon } from '@/components/icons/texture-icon';
import { Text } from '@/components/text';
import {
  ImageTextureError,
  loadImageTexture,
  PART_COLOR_MAP_ACCEPT,
} from '../adapters/load-image-texture';
import {
  applyPartColorMap,
  clearPartColorMap,
} from '../domain/part-color-map';

interface PartTextureControlProps {
  material: MeshStandardMaterial;
  /** Remount / reset draft when the selected part changes. */
  meshId: string;
}

function mapLabel(material: MeshStandardMaterial): string | null {
  const map = material.map;
  if (!map) {
    return null;
  }
  return map.name || 'Texture applied';
}

/**
 * Settings Texture row: choose / replace / clear a color map on the selected
 * created part. Color remains a multiplier. Only mounts under PartInspector.
 */
export function PartTextureControl({ material, meshId }: PartTextureControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState<string | null>(() => mapLabel(material));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLabel(mapLabel(material));
    setError(null);
    setBusy(false);
  }, [meshId, material]);

  const hasMap = label !== null;

  const handlePick = async (file: File | undefined) => {
    if (!file || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const texture = await loadImageTexture(file, material.map);
      applyPartColorMap(material, texture);
      setLabel(mapLabel(material) ?? file.name);
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

  const handleClear = () => {
    if (busy || !material.map) {
      return;
    }
    setError(null);
    clearPartColorMap(material);
    setLabel(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <Text variant="muted">Texture</Text>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={PART_COLOR_MAP_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            void handlePick(file);
          }}
        />
        <Button
          variant="default"
          disabled={busy}
          className="inline-flex items-center gap-2"
          title={hasMap ? 'Replace texture' : 'Choose texture'}
          aria-label={hasMap ? 'Replace texture' : 'Choose texture'}
          onClick={() => inputRef.current?.click()}
        >
          <TextureIcon aria-hidden />
          {busy ? 'Loading…' : hasMap ? 'Replace' : 'Choose'}
        </Button>
        <Button
          variant="ghost"
          disabled={busy || !hasMap}
          title={hasMap ? 'Clear texture' : 'No texture to clear'}
          aria-label="Clear texture"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>
      {hasMap && (
        <Text variant="muted" className="wrap-break-word">
          {label}
        </Text>
      )}
      {error && (
        <Text variant="error" className="wrap-break-word whitespace-normal">
          {error}
        </Text>
      )}
    </div>
  );
}
