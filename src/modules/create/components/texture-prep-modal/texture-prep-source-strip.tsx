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
    <div className="flex flex-col gap-4">
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
      <div className="flex items-center gap-4">
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
        <Text as="p" variant="muted" className="min-w-0 flex-1 truncate">
          {displayName ?? 'No image chosen'}
        </Text>
      </div>
      <Button
        variant="default"
        disabled={busy}
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        {pickButtonLabel(busy, hasSource)}
      </Button>
    </div>
  );
}
