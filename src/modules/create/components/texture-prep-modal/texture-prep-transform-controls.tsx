import { Button } from '@/components/button';
import { Text } from '@/components/text';

interface TexturePrepTransformControlsProps {
  enabled: boolean;
  busy: boolean;
  canCrop: boolean;
  onFlipX: () => void;
  onFlipY: () => void;
  onStartCrop: () => void;
}

/** Flip / crop controls for the draft texture. */
export function TexturePrepTransformControls({
  enabled,
  busy,
  canCrop,
  onFlipX,
  onFlipY,
  onStartCrop,
}: TexturePrepTransformControlsProps) {
  const disabled = !enabled || busy;

  return (
    <div className="flex flex-col gap-2">
      <Text as="h2" variant="section" size="xs">
        Adjust
      </Text>
      <div className="flex flex-col gap-2">
        <Button
          variant="default"
          disabled={disabled}
          className="w-full justify-start"
          onClick={onFlipX}
          title="Mirror the image left to right"
        >
          Flip horizontal
        </Button>
        <Button
          variant="default"
          disabled={disabled}
          className="w-full justify-start"
          onClick={onFlipY}
          title="Mirror the image top to bottom"
        >
          Flip vertical
        </Button>
        <Button
          variant="default"
          disabled={disabled || !canCrop}
          className="w-full justify-start"
          onClick={onStartCrop}
          title="Drag to choose which part of the image to keep"
        >
          Crop…
        </Button>
      </div>
    </div>
  );
}
