import { Button } from '@/components/button';
import { Text } from '@/components/text';

interface TexturePrepTransformControlsProps {
  enabled: boolean;
  busy: boolean;
  canCropToSquare: boolean;
  onFlipX: () => void;
  onFlipY: () => void;
  onCropToSquare: () => void;
}

/** Flip / center-square crop controls for the draft texture. */
export function TexturePrepTransformControls({
  enabled,
  busy,
  canCropToSquare,
  onFlipX,
  onFlipY,
  onCropToSquare,
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
          disabled={disabled || !canCropToSquare}
          className="w-full justify-start"
          onClick={onCropToSquare}
          title={
            canCropToSquare
              ? 'Crop to a centered square'
              : 'Image is already square'
          }
        >
          Crop to square
        </Button>
      </div>
    </div>
  );
}
