import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { TextureIcon } from '@/components/icons/texture-icon';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  ImageTextureError,
  loadImageTexture,
  PART_COLOR_MAP_ACCEPT,
} from '../adapters/load-image-texture';
import {
  applyPartColorMap,
  clearPartColorMap,
} from '../domain/part-color-map';
import { useSelectedCreatedPartMaterial } from '../hooks/use-selected-created-part';

function toolTitle(
  enabled: boolean,
  hasMap: boolean,
  busy: boolean,
  error: string | null,
): string {
  if (error) {
    return error;
  }
  if (!enabled) {
    return 'Select a part to edit texture';
  }
  if (busy) {
    return 'Loading texture…';
  }
  if (hasMap) {
    return 'Part texture — click to replace, right-click to clear';
  }
  return 'Part texture';
}

export function PartTextureTool() {
  const material = useSelectedCreatedPartMaterial();
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasMap, setHasMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const enabled = material !== null && !busy;

  useEffect(() => {
    setHasMap(Boolean(material?.map));
    setError(null);
    setBusy(false);
  }, [material, selected]);

  const handlePick = async (file: File | undefined) => {
    if (!file || !material || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const texture = await loadImageTexture(file, material.map);
      applyPartColorMap(material, texture);
      setHasMap(true);
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
    if (!material?.map || busy) {
      return;
    }
    setError(null);
    clearPartColorMap(material);
    setHasMap(false);
  };

  const title = toolTitle(enabled, hasMap, busy, error);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PART_COLOR_MAP_ACCEPT}
        disabled={!enabled}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void handlePick(file);
        }}
      />
      <Button
        variant={hasMap ? 'primary' : 'ghost'}
        disabled={!enabled}
        title={title}
        aria-label={hasMap ? 'Replace or clear part texture' : 'Part texture'}
        aria-pressed={hasMap}
        onClick={() => inputRef.current?.click()}
        onContextMenu={(event) => {
          event.preventDefault();
          handleClear();
        }}
      >
        <TextureIcon aria-hidden />
      </Button>
    </>
  );
}
