import { useRef } from 'react';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { PART_COLOR_MAP_ACCEPT } from '@/modules/create/adapters/load-image-texture';

interface TexturePrepSourceStripProps {
  displayName: string | null;
  thumbUrl: string | null;
  hasSource: boolean;
  busy: boolean;
  onPickFile: (file: File | undefined) => void;
}

function pickButtonLabel(busy: boolean, hasSource: boolean): string {
  if (busy) {
    return 'Loading…';
  }
  if (hasSource) {
    return 'Replace image…';
  }
  return 'Choose image…';
}

/** Thumbnail + file name + choose / replace control. */
export function TexturePrepSourceStrip({
  displayName,
  thumbUrl,
  hasSource,
  busy,
  onPickFile,
}: TexturePrepSourceStripProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={PART_COLOR_MAP_ACCEPT}
        disabled={busy}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          onPickFile(file);
        }}
      />
      {thumbUrl
        ? (
            <img
              src={thumbUrl}
              alt=""
              className="size-12 shrink-0 rounded-sm border border-border object-cover bg-control"
            />
          )
        : (
            <div
              className="size-12 shrink-0 rounded-sm border border-border bg-control"
              aria-hidden
            />
          )}
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <Text as="p" variant="muted" className="truncate">
          {displayName ?? 'No image chosen'}
        </Text>
        <Button
          variant="default"
          disabled={busy}
          className="w-fit"
          onClick={() => inputRef.current?.click()}
        >
          {pickButtonLabel(busy, hasSource)}
        </Button>
      </div>
    </div>
  );
}
