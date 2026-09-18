import type { SaveKeyframeClipSlice } from '@/modules/animation/types/undo-stack';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useRef } from 'react';
import { Text } from '@/components/text';
import {
  findTrackByName,
  listTrackKeyframes,
} from '@/modules/animation/domain/list-clip-tracks';
import {
  $clips,
  captureKeyframeEditSnapshot,
  finalizeKeyframeEdit,
  updateClipKeyframe,
} from '@/modules/animation/stores/clip-store';
import {
  $selectedKeyIndex,
  selectKeyframeKey,
} from '@/modules/animation/stores/keyframe-ui-store';

interface KeyframeKeyTableProps {
  trackName: string;
}

/**
 * Spreadsheet-style keys for one track: select a row, edit time / values.
 * Undo coalesces per focus gesture (same pattern as trim inputs).
 */
export function KeyframeKeyTable({ trackName }: KeyframeKeyTableProps) {
  const { clips, activeClipId } = useStore($clips, {
    keys: ['clips', 'activeClipId'],
  });
  const selectedKeyIndex = useStore($selectedKeyIndex);
  const undoFromRef = useRef<SaveKeyframeClipSlice | null>(null);
  const dirtyRef = useRef(false);

  const active = clips.find((entry) => entry.id === activeClipId);
  const track = active?.clip ? findTrackByName(active.clip, trackName) : undefined;
  const keys = track ? listTrackKeyframes(track) : [];
  const valueSize = track?.getValueSize() ?? 0;

  if (!track || keys.length === 0) {
    return (
      <Text as="p" variant="muted">
        This track has no keyframes.
      </Text>
    );
  }

  const captureUndoFrom = () => {
    if (undoFromRef.current === null) {
      undoFromRef.current = captureKeyframeEditSnapshot();
    }
  };

  const commitUndo = () => {
    const undoFrom = undoFromRef.current;
    const dirty = dirtyRef.current;
    undoFromRef.current = null;
    dirtyRef.current = false;
    if (!dirty) {
      return;
    }
    finalizeKeyframeEdit(undoFrom);
  };

  const applyLivePatch = (
    keyIndex: number,
    patch: { time?: number; values?: number[] },
  ) => {
    captureUndoFrom();
    dirtyRef.current = true;
    const result = updateClipKeyframe(trackName, keyIndex, patch, {
      recordUndo: false,
    });
    if (result) {
      selectKeyframeKey(result.keyIndex);
    }
  };

  const valueChannels = Array.from({ length: valueSize }, (_, channel) => ({
    channel,
    label: `v${channel}`,
  }));

  return (
    <div className="flex max-h-64 flex-col gap-2 overflow-x-auto overflow-y-auto">
      <div
        className="grid gap-2 text-fg-muted"
        style={{
          gridTemplateColumns: `1.5rem 4rem repeat(${valueSize}, minmax(3rem, 1fr))`,
        }}
      >
        <Text variant="muted">#</Text>
        <Text variant="muted">Time</Text>
        {valueChannels.map(({ label }) => (
          <Text key={label} variant="muted">
            {label}
          </Text>
        ))}
      </div>

      {keys.map((key) => {
        const isSelected = key.index === selectedKeyIndex;
        return (
          <div
            key={`${trackName}-${key.index}-${key.time}`}
            role="row"
            aria-selected={isSelected}
            className={cn(
              'grid items-center gap-2 rounded-sm px-2 py-2',
              isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover/40',
            )}
            style={{
              gridTemplateColumns: `1.5rem 4rem repeat(${valueSize}, minmax(3rem, 1fr))`,
            }}
            onClick={() => {
              selectKeyframeKey(isSelected ? null : key.index);
            }}
          >
            <Text variant="numeric" className="text-fg-muted">
              {key.index}
            </Text>
            <input
              aria-label={`Key ${key.index} time`}
              type="number"
              step={0.01}
              min={0}
              value={key.time}
              className="w-full rounded-sm bg-control px-2 py-2 text-xs text-fg"
              onClick={(event) => event.stopPropagation()}
              onFocus={() => {
                selectKeyframeKey(key.index);
                captureUndoFrom();
              }}
              onChange={(event) => {
                applyLivePatch(key.index, {
                  time: Number(event.currentTarget.value),
                });
              }}
              onBlur={commitUndo}
            />
            {valueChannels.map(({ channel, label }) => (
              <input
                key={label}
                aria-label={`Key ${key.index} ${label}`}
                type="number"
                step={0.01}
                value={key.values[channel] ?? 0}
                className="w-full rounded-sm bg-control px-2 py-2 text-xs text-fg"
                onClick={(event) => event.stopPropagation()}
                onFocus={() => {
                  selectKeyframeKey(key.index);
                  captureUndoFrom();
                }}
                onChange={(event) => {
                  const nextValues = [...key.values];
                  nextValues[channel] = Number(event.currentTarget.value);
                  applyLivePatch(key.index, { values: nextValues });
                }}
                onBlur={commitUndo}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
