import type { TextureWrapPresetId } from '@/modules/create/domain/color-map/texture-wrap-preset';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import {
  TEXTURE_WRAP_PRESETS,

} from '@/modules/create/domain/color-map/texture-wrap-preset';

interface TexturePrepWrapControlsProps {
  enabled: boolean;
  busy: boolean;
  value: TextureWrapPresetId;
  onChange: (preset: TextureWrapPresetId) => void;
}

/** Clamp / Tile wrap presets for the draft color map. */
export function TexturePrepWrapControls({
  enabled,
  busy,
  value,
  onChange,
}: TexturePrepWrapControlsProps) {
  const disabled = !enabled || busy;

  return (
    <div className="flex flex-col gap-2">
      <Text as="h2" variant="section" size="xs">
        Wrap
      </Text>
      <div
        className="flex flex-col gap-2"
        role="group"
        aria-label="Texture wrap"
      >
        {TEXTURE_WRAP_PRESETS.map((preset) => {
          const selected = value === preset.id;
          return (
            <Button
              key={preset.id}
              variant={selected ? 'primary' : 'default'}
              disabled={disabled}
              className="w-full justify-start"
              aria-pressed={selected}
              title={preset.title}
              onClick={() => {
                onChange(preset.id);
              }}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
