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
      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          disabled={disabled}
          onClick={onFlipX}
          title="Flip horizontal"
        >
          Flip H
        </Button>
        <Button
          variant="default"
          disabled={disabled}
          onClick={onFlipY}
          title="Flip vertical"
        >
          Flip V
        </Button>
        <Button
          variant="default"
          disabled={disabled || !canCropToSquare}
          onClick={onCropToSquare}
          title={
            canCropToSquare
              ? 'Crop to a centered square'
              : 'Image is already square'
          }
        >
          Crop square
        </Button>
      </div>
    </div>
  );
}
