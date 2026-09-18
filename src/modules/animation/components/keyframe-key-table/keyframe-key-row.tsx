import type { TrackKeyframe } from '@/modules/animation/domain/list-clip-tracks';
import { cn } from '@maxigarcia/js-utils';
import { Button } from '@/components/button';
import { TrashIcon } from '@/components/icons/trash-icon';
import { Text } from '@/components/text';
import { selectKeyframeKey } from '@/modules/animation/stores/keyframe-ui-store';
import { keyframeKeyGridTemplate } from './keyframe-key-grid';

interface KeyframeKeyRowProps {
  trackName: string;
  keyframe: TrackKeyframe;
  valueSize: number;
  valueChannels: readonly { channel: number; label: string }[];
  isSelected: boolean;
  isPlayhead: boolean;
  canDelete: boolean;
  onDelete: (keyIndex: number) => void;
  onCaptureUndo: () => void;
  onCommitUndo: () => void;
  onLivePatch: (
    keyIndex: number,
    patch: { time?: number; values?: number[] },
  ) => void;
}

export function KeyframeKeyRow({
  trackName,
  keyframe,
  valueSize,
  valueChannels,
  isSelected,
  isPlayhead,
  canDelete,
  onDelete,
  onCaptureUndo,
  onCommitUndo,
  onLivePatch,
}: KeyframeKeyRowProps) {
  const { index, time, values } = keyframe;

  return (
    <div
      role="row"
      aria-selected={isSelected}
      aria-current={isPlayhead ? 'true' : undefined}
      className={cn(
        'grid items-center gap-2 rounded-sm border-l-2 px-2 py-2',
        isPlayhead ? 'border-accent bg-control' : 'border-transparent',
        isSelected && !isPlayhead && 'bg-surface-hover',
        !isSelected && !isPlayhead && 'hover:bg-surface-hover/40',
        isSelected && isPlayhead && 'bg-surface-hover',
      )}
      style={{ gridTemplateColumns: keyframeKeyGridTemplate(valueSize) }}
      onClick={() => {
        selectKeyframeKey(isSelected ? null : index);
      }}
    >
      <Text variant="numeric" className="text-fg-muted">
        {index}
      </Text>
      <input
        aria-label={`Key ${index} time`}
        type="number"
        step={0.01}
        min={0}
        value={time}
        className="w-full rounded-sm bg-control px-2 py-2 text-xs text-fg"
        onClick={(event) => event.stopPropagation()}
        onFocus={() => {
          selectKeyframeKey(index);
          onCaptureUndo();
        }}
        onChange={(event) => {
          onLivePatch(index, { time: Number(event.currentTarget.value) });
        }}
        onBlur={onCommitUndo}
      />
      {valueChannels.map(({ channel, label }) => (
        <input
          key={`${trackName}-${index}-${label}`}
          aria-label={`Key ${index} ${label}`}
          type="number"
          step={0.01}
          value={values[channel] ?? 0}
          className="w-full rounded-sm bg-control px-2 py-2 text-xs text-fg"
          onClick={(event) => event.stopPropagation()}
          onFocus={() => {
            selectKeyframeKey(index);
            onCaptureUndo();
          }}
          onChange={(event) => {
            const nextValues = [...values];
            nextValues[channel] = Number(event.currentTarget.value);
            onLivePatch(index, { values: nextValues });
          }}
          onBlur={onCommitUndo}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        className="justify-self-end p-2"
        aria-label={`Delete key ${index}`}
        title={
          canDelete
            ? `Delete key ${index}`
            : 'Keep at least one keyframe on the track'
        }
        disabled={!canDelete}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(index);
        }}
      >
        <TrashIcon aria-hidden />
      </Button>
    </div>
  );
}
