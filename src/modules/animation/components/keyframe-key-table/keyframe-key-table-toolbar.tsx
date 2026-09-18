import type { SelectOption } from '@/components/select';
import type { TrackInterpolationMode } from '@/modules/animation/domain/keyframe-interpolation';
import { Button } from '@/components/button';
import { PlusIcon } from '@/components/icons/plus-icon';
import { Select } from '@/components/select';
import { Text } from '@/components/text';

interface KeyframeKeyTableToolbarProps {
  interpolationValue: string | null;
  interpolationOptions: SelectOption[];
  onAddAtPlayhead: () => void;
  onInterpolationChange: (mode: TrackInterpolationMode) => void;
}

/**
 * Keys chrome: title, then one controls row (interpolation + add).
 */
export function KeyframeKeyTableToolbar({
  interpolationValue,
  interpolationOptions,
  onAddAtPlayhead,
  onInterpolationChange,
}: KeyframeKeyTableToolbarProps) {
  const showInterpolation
    = interpolationOptions.length > 0 && interpolationValue !== null;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="muted">Keys</Text>

      <div className="flex flex-wrap items-center gap-2">
        {showInterpolation && (
          <>
            <Text variant="muted" className="shrink-0">
              Track interpolation
            </Text>
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
          </>
        )}
        <Button
          type="button"
          variant="default"
          aria-label="Add key at playhead"
          title="Add key at playhead"
          className="ml-auto flex items-center gap-2"
          onClick={onAddAtPlayhead}
        >
          <PlusIcon aria-hidden />
          Add key at playhead
        </Button>
      </div>
    </div>
  );
}
