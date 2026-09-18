import type { TrackInterpolationMode } from '@/modules/animation/domain/keyframe-write';
import type { SaveKeyframeClipSlice } from '@/modules/animation/types/undo-stack';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import {
  getTrackInterpolation,
  listSupportedTrackInterpolations,
  trackInterpolationLabel,
} from '@/modules/animation/domain/keyframe-write';
import {
  findPlayheadKeyframeIndex,
  findTrackByName,
  listTrackKeyframes,
  trackValueChannelLabels,
} from '@/modules/animation/domain/list-clip-tracks';
import {
  $clips,
  addClipKeyframe,
  captureKeyframeEditSnapshot,
  deleteClipKeyframe,
  finalizeKeyframeEdit,
  setClipTrackInterpolation,
  updateClipKeyframe,
} from '@/modules/animation/stores/clip-store';
import {
  $selectedKeyIndex,
  selectKeyframeKey,
} from '@/modules/animation/stores/keyframe-ui-store';
import { readClipTimelineTime } from '@/modules/animation/utils/to-timeline-time';

interface KeyframeKeyTableProps {
  trackName: string;
}

/**
 * Spreadsheet-style keys for one track: select a row, edit time / values,
 * add at playhead, delete selection, and change interpolation when supported.
 * Playhead row highlight is separate from edit selection.
 * Undo coalesces per focus gesture (same pattern as trim inputs).
 */
export function KeyframeKeyTable({ trackName }: KeyframeKeyTableProps) {
  const { clips, activeClipId } = useStore($clips, {
    keys: ['clips', 'activeClipId'],
  });
  const selectedKeyIndex = useStore($selectedKeyIndex);
  const undoFromRef = useRef<SaveKeyframeClipSlice | null>(null);
  const dirtyRef = useRef(false);
  const [playheadKeyIndex, setPlayheadKeyIndex] = useState<number | null>(null);

  const active = clips.find((entry) => entry.id === activeClipId);
  const track = active?.clip ? findTrackByName(active.clip, trackName) : undefined;
  const keys = track ? listTrackKeyframes(track) : [];
  const valueSize = track?.getValueSize() ?? 0;
  const keyTimesKey = keys.map((key) => key.time).join(',');
  const supportedInterpolations = track
    ? listSupportedTrackInterpolations(track)
    : [];
  const currentInterpolation = track ? getTrackInterpolation(track) : null;
  const interpolationOptions = supportedInterpolations.map((mode) => ({
    value: String(mode),
    label: trackInterpolationLabel(mode),
  }));

  useEffect(() => {
    const times = keyTimesKey.length === 0
      ? []
      : keyTimesKey.split(',').map(Number);

    let rafId = 0;
    const tick = () => {
      const next = findPlayheadKeyframeIndex(times, readClipTimelineTime());
      setPlayheadKeyIndex((current) => (current === next ? current : next));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [trackName, keyTimesKey]);

  if (!track) {
    return (
      <Text as="p" variant="muted">
        Track not found on the active clip.
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

  const handleAddAtPlayhead = () => {
    const result = addClipKeyframe(trackName, readClipTimelineTime());
    if (result) {
      selectKeyframeKey(result.keyIndex);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedKeyIndex === null) {
      return;
    }
    const result = deleteClipKeyframe(trackName, selectedKeyIndex);
    if (!result) {
      return;
    }
    selectKeyframeKey(result.keyIndex);
  };

  const handleInterpolationChange = (value: string) => {
    const mode = Number(value) as TrackInterpolationMode;
    setClipTrackInterpolation(trackName, mode);
  };

  const valueChannels = trackValueChannelLabels(trackName, valueSize).map(
    (label, channel) => ({ channel, label }),
  );

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <div className="flex flex-wrap items-end gap-2">
        <Button
          type="button"
          variant="default"
          aria-label="Add keyframe at playhead"
          title="Add keyframe at playhead"
          onClick={handleAddAtPlayhead}
        >
          Add
        </Button>
        <Button
          type="button"
          variant="default"
          aria-label="Delete selected keyframe"
          title={
            keys.length <= 1
              ? 'Keep at least one keyframe on the track'
              : 'Delete selected keyframe'
          }
          disabled={selectedKeyIndex === null || keys.length <= 1}
          onClick={handleDeleteSelected}
        >
          Delete
        </Button>
        {interpolationOptions.length > 0 && currentInterpolation !== null && (
          <div className="flex flex-col gap-2">
            <Text variant="muted">Interpolation</Text>
            <Select
              aria-label="Track interpolation"
              className="w-28"
              value={String(currentInterpolation)}
              options={interpolationOptions}
              onChange={(event) => {
                handleInterpolationChange(event.target.value);
              }}
            />
          </div>
        )}
      </div>

      {keys.length === 0
        ? (
            <Text as="p" variant="muted">
              This track has no keyframes. Add one at the playhead.
            </Text>
          )
        : (
            <>
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
                const isPlayhead = key.index === playheadKeyIndex;
                return (
                  <div
                    key={`${trackName}-${key.index}-${key.time}`}
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
            </>
          )}
    </div>
  );
}
