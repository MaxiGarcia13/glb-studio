import type { SelectOption } from '@/components/select';
import type { TrackInterpolationMode } from '@/modules/animation/domain/keyframe-write';
import { Button } from '@/components/button';
import { Select } from '@/components/select';
import { Text } from '@/components/text';

interface KeyframeKeyTableToolbarProps {
  interpolationValue: string | null;
  interpolationOptions: SelectOption[];
  onAddAtPlayhead: () => void;
  onInterpolationChange: (mode: TrackInterpolationMode) => void;
}

export function KeyframeKeyTableToolbar({
  interpolationValue,
  interpolationOptions,
  onAddAtPlayhead,
  onInterpolationChange,
}: KeyframeKeyTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Button
        type="button"
        variant="default"
        aria-label="Add keyframe at playhead"
        title="Add keyframe at playhead"
        onClick={onAddAtPlayhead}
      >
        Add
      </Button>
      {interpolationOptions.length > 0 && interpolationValue !== null && (
        <div className="flex flex-col gap-2">
          <Text variant="muted">Interpolation</Text>
          <Select
            aria-label="Track interpolation"
            className="w-28"
            value={interpolationValue}
            options={interpolationOptions}
            onChange={(event) => {
              onInterpolationChange(
                Number(event.target.value) as TrackInterpolationMode,
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
