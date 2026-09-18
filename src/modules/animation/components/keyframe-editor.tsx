import type { ClipTrackInfo } from '@/modules/animation/domain/list-clip-tracks';
import type { KeyframeTrackFilter } from '@/modules/animation/stores/keyframe-ui-store';
import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import {
  clipTrackDisplayLabel,
  filterClipTracksByNode,
  listClipTracks,
} from '@/modules/animation/domain/list-clip-tracks';
import {
  $clips,
  isReadyClip,
} from '@/modules/animation/stores/clip-store';
import {
  $keyframeTrackFilter,
  $selectedTrackName,
  clearKeyframeTrackSelection,
  selectKeyframeTrack,
  setKeyframeTrackFilter,
} from '@/modules/animation/stores/keyframe-ui-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { KeyframeKeyTable } from './keyframe-key-table';

const FILTER_OPTIONS: { value: KeyframeTrackFilter; label: string }[] = [
  { value: 'selected', label: 'Selected bone' },
  { value: 'all', label: 'All tracks' },
];

function resolveVisibleTracks(
  allTracks: ClipTrackInfo[],
  filter: KeyframeTrackFilter,
  selectionNodeName: string | null,
): ClipTrackInfo[] {
  if (filter === 'selected') {
    return filterClipTracksByNode(allTracks, selectionNodeName);
  }
  return allTracks;
}

/**
 * Settings Keys stack: filter + track list + key table (until Settings Keys is removed).
 */
export function KeyframeEditor({ className }: { className?: string }) {
  const { clips, activeClipId } = useStore($clips, {
    keys: ['clips', 'activeClipId'],
  });
  const filter = useStore($keyframeTrackFilter);
  const selectedTrackName = useStore($selectedTrackName);
  const { kind, object } = useStore($selection, { keys: ['kind', 'object'] });

  const active = clips.find((entry) => entry.id === activeClipId);
  const canEdit = isReadyClip(active);
  const selectionNodeName
    = kind === 'parts' && object
      ? object.name || object.uuid
      : null;
  const allTracks = canEdit ? listClipTracks(active.clip) : [];
  const tracks = canEdit
    ? resolveVisibleTracks(allTracks, filter, selectionNodeName)
    : [];
  const trackInView
    = selectedTrackName !== null
      && tracks.some((track) => track.name === selectedTrackName);

  useEffect(() => {
    if (selectedTrackName === null) {
      return;
    }
    if (!canEdit || !trackInView) {
      clearKeyframeTrackSelection();
    }
  }, [activeClipId, canEdit, selectedTrackName, trackInView]);

  if (!canEdit) {
    return (
      <Text as="p" variant="muted" className={className}>
        Select a ready animation to inspect its tracks.
      </Text>
    );
  }

  let emptyMessage: string | null = null;
  if (tracks.length === 0) {
    if (filter === 'selected' && !selectionNodeName) {
      emptyMessage = 'Select a bone in the Library outliner to filter tracks.';
    } else if (filter === 'selected') {
      emptyMessage = 'No tracks for this bone on the active clip.';
    } else {
      emptyMessage = 'This clip has no tracks.';
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Select
        label="Filter"
        value={filter}
        onChange={(event) => {
          setKeyframeTrackFilter(event.target.value as KeyframeTrackFilter);
        }}
        options={FILTER_OPTIONS}
      />

      {selectionNodeName && filter === 'selected' && (
        <Text variant="muted" className="truncate" title={selectionNodeName}>
          {selectionNodeName}
        </Text>
      )}

      {emptyMessage
        ? (
            <Text as="p" variant="muted">
              {emptyMessage}
            </Text>
          )
        : (
            <div
              className="flex max-h-48 flex-col gap-2 overflow-y-auto"
              role="listbox"
              aria-label="Clip tracks"
            >
              {tracks.map((track) => {
                const isSelected = track.name === selectedTrackName;
                const label = clipTrackDisplayLabel(track);

                return (
                  <button
                    key={track.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    title={track.name}
                    className={cn(
                      'flex w-full min-h-8 items-center gap-2 rounded-sm px-2 py-2 text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-surface-hover text-fg'
                        : 'text-fg hover:bg-surface-hover/40',
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      selectKeyframeTrack(isSelected ? null : track.name);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <span className="shrink-0 text-fg-muted">
                      {track.keyCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

      {selectedTrackName && trackInView && (
        <KeyframeKeyTable trackName={selectedTrackName} />
      )}
    </div>
  );
}
