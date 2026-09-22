import { Button } from '@/components/button';
import { Text } from '@/components/text';

interface TexturePrepBgRemoveProps {
  enabled: boolean;
  busy: boolean;
  onRemoveBackground: () => void;
}

/** Opt-in client-side background removal (WASM runs in the browser). */
export function TexturePrepBgRemove({
  enabled,
  busy,
  onRemoveBackground,
}: TexturePrepBgRemoveProps) {
  const disabled = !enabled || busy;

  return (
    <div className="flex flex-col gap-2">
      <Text as="h2" variant="section" size="xs">
        Background
      </Text>
      <Button
        variant="default"
        disabled={disabled}
        className="w-full justify-start"
        title="Remove the image background in your browser"
        onClick={onRemoveBackground}
      >
        Remove background
      </Button>
      <Text as="p" variant="muted">
        Runs in your browser. First use downloads a small model.
      </Text>
    </div>
  );
}
