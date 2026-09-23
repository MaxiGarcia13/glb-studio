import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextureIcon } from '@/components/icons/texture-icon';
import { $selection } from '@/modules/viewport/stores/selection-store';
import {
  ImageTextureError,
  PART_COLOR_MAP_ACCEPT,
} from '../adapters/load-image-texture';
import { replaceMaterialColorMapFromFile } from '../adapters/replace-material-color-map-from-file';
import { clearColorMap } from '../domain/material-color-map';
import { useSkinnedTextureAvailability } from '../hooks/use-skinned-texture';

function toolTitle(
  enabled: boolean,
  hasMap: boolean,
  reason: string,
  error: string | null,
  busy: boolean,
): string {
  if (error) {
    return error;
  }
  if (busy) {
    return 'Loading texture…';
  }
  if (!enabled) {
    return reason;
  }
  if (hasMap) {
    return `${reason} — click to replace, right-click to clear`;
  }
  return reason;
}

export function SkinnedTextureTool() {
  const availability = useSkinnedTextureAvailability();
  const material = availability.target?.material ?? null;
  const { object: selected } = useStore($selection, { keys: ['object'] });
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasMap, setHasMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const enabled = availability.enabled && material !== null && !busy;

  useEffect(() => {
    setHasMap(Boolean(material?.map));
    setError(null);
  }, [material, selected, availability.target?.mesh]);

  const handleClear = () => {
    if (!material?.map || busy) {
      return;
    }
    clearColorMap(material);
    setHasMap(false);
    setError(null);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !material || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await replaceMaterialColorMapFromFile(material, file);
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

  const title = toolTitle(
    availability.enabled && material !== null,
    hasMap,
    availability.reason,
    error,
    busy,
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PART_COLOR_MAP_ACCEPT}
        aria-hidden
        tabIndex={-1}
        className="sr-only"
        disabled={!enabled}
        onChange={handleFileChange}
      />
      <Button
        variant={hasMap ? 'primary' : 'ghost'}
        disabled={!enabled}
        title={title}
        aria-label={hasMap ? 'Replace or clear model texture' : 'Model texture'}
        aria-pressed={hasMap}
        aria-busy={busy || undefined}
        onClick={() => {
          if (enabled) {
            inputRef.current?.click();
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          if (!enabled) {
            return;
          }
          handleClear();
        }}
      >
        <TextureIcon aria-hidden />
      </Button>
      {error
        ? (
            <Text
              size="sm"
              variant="error"
              role="alert"
              className="absolute bottom-full left-1/2 mb-2 w-max max-w-xs -translate-x-1/2 text-center"
            >
              {error}
            </Text>
          )
        : null}
    </>
  );
}
