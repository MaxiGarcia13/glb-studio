import { useStore } from '@nanostores/react';
import { Text } from '@/components/text';
import {
  getTrackInterpolation,
  listSupportedTrackInterpolations,
  trackInterpolationLabel,
} from '@/modules/animation/domain/keyframe-write';
import {
  findTrackByName,
  listTrackKeyframes,
  trackValueChannelLabels,
} from '@/modules/animation/domain/list-clip-tracks';
import {
  $clips,
  addClipKeyframe,
  deleteClipKeyframe,
  setClipTrackInterpolation,
} from '@/modules/animation/stores/clip-store';
import {
  $selectedKeyIndex,
  selectKeyframeKey,
} from '@/modules/animation/stores/keyframe-ui-store';
import { readClipTimelineTime } from '@/modules/animation/utils/to-timeline-time';
import { KeyframeKeyRow } from './keyframe-key-row';
import { KeyframeKeyTableHeader } from './keyframe-key-table-header';
import { KeyframeKeyTableToolbar } from './keyframe-key-table-toolbar';
import { useKeyframeEditGesture } from './use-keyframe-edit-gesture';
import { useKeyframePlayheadIndex } from './use-keyframe-playhead-index';

interface KeyframeKeyTableProps {
  trackName: string;
}

/**
 * Spreadsheet-style keys for one track: select a row, edit time / values,
 * add at playhead, per-row delete, and change interpolation when supported.
 * Playhead row highlight is separate from edit selection.
 */
export function KeyframeKeyTable({ trackName }: KeyframeKeyTableProps) {
  const { clips, activeClipId } = useStore($clips, {
    keys: ['clips', 'activeClipId'],
  });
  const selectedKeyIndex = useStore($selectedKeyIndex);
  const { captureUndoFrom, commitUndo, applyLivePatch }
    = useKeyframeEditGesture(trackName);

  const active = clips.find((entry) => entry.id === activeClipId);
  const track = active?.clip ? findTrackByName(active.clip, trackName) : undefined;
  const keys = track ? listTrackKeyframes(track) : [];
  const valueSize = track?.getValueSize() ?? 0;
  const canDelete = keys.length > 1;
  const playheadKeyIndex = useKeyframePlayheadIndex(
    trackName,
    keys.map((key) => key.time),
  );

  const supportedInterpolations = track
    ? listSupportedTrackInterpolations(track)
    : [];
  const currentInterpolation = track ? getTrackInterpolation(track) : null;
  const interpolationOptions = supportedInterpolations.map((mode) => ({
    value: String(mode),
    label: trackInterpolationLabel(mode),
  }));
  const valueChannels = trackValueChannelLabels(trackName, valueSize).map(
    (label, channel) => ({ channel, label }),
  );

  if (!track) {
    return (
      <Text as="p" variant="muted">
        Track not found on the active clip.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <KeyframeKeyTableToolbar
        interpolationValue={
          currentInterpolation !== null ? String(currentInterpolation) : null
        }
        interpolationOptions={interpolationOptions}
        onAddAtPlayhead={() => {
          const result = addClipKeyframe(trackName, readClipTimelineTime());
          if (result) {
            selectKeyframeKey(result.keyIndex);
          }
        }}
        onInterpolationChange={(mode) => {
          setClipTrackInterpolation(trackName, mode);
        }}
      />

      {keys.length === 0
        ? (
            <Text as="p" variant="muted">
              This track has no keyframes. Add one at the playhead.
            </Text>
          )
        : (
            <>
              <KeyframeKeyTableHeader
                valueSize={valueSize}
                valueChannels={valueChannels}
              />
              {keys.map((keyframe) => (
                <KeyframeKeyRow
                  key={`${trackName}-${keyframe.index}-${keyframe.time}`}
                  trackName={trackName}
                  keyframe={keyframe}
                  valueSize={valueSize}
                  valueChannels={valueChannels}
                  isSelected={keyframe.index === selectedKeyIndex}
                  isPlayhead={keyframe.index === playheadKeyIndex}
                  canDelete={canDelete}
                  onDelete={(keyIndex) => {
                    const result = deleteClipKeyframe(trackName, keyIndex);
                    if (result) {
                      selectKeyframeKey(result.keyIndex);
                    }
                  }}
                  onCaptureUndo={captureUndoFrom}
                  onCommitUndo={commitUndo}
                  onLivePatch={applyLivePatch}
                />
              ))}
            </>
          )}
    </div>
  );
}
