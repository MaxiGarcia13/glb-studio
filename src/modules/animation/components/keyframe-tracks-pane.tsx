import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { Text } from '@/components/text';
import { KeyframeKeyTable } from '@/modules/animation/components/keyframe-key-table';
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
  $selectedTrackName,
  clearKeyframeTrackSelection,
  selectKeyframeTrack,
} from '@/modules/animation/stores/keyframe-ui-store';
import { $selection } from '@/modules/viewport/stores/selection-store';

/**
 * Bottom-bar Tracks mode: track list (left) | key table (right).
 * Bone selection from Library / viewport filters the left list; clear → all tracks.
 */
export function KeyframeTracksPane() {
  const { clips, activeClipId } = useStore($clips, {
    keys: ['clips', 'activeClipId'],
  });
  const selectedTrackName = useStore($selectedTrackName);
  const { kind, object } = useStore($selection, { keys: ['kind', 'object'] });

  const active = clips.find((entry) => entry.id === activeClipId);
  const canEdit = isReadyClip(active);
  const selectionNodeName
    = kind === 'parts' && object
      ? object.name || object.uuid
      : null;
  const allTracks = canEdit ? listClipTracks(active.clip) : [];
  const tracks = selectionNodeName
    ? filterClipTracksByNode(allTracks, selectionNodeName)
    : allTracks;
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
      <div className="flex h-64 items-center justify-center">
        <Text as="p" variant="muted">
          Select a ready animation to inspect its tracks.
        </Text>
      </div>
    );
  }

  let emptyMessage: string | null = null;
  if (tracks.length === 0) {
    emptyMessage = selectionNodeName
      ? 'No tracks for this bone on the active clip.'
      : 'This clip has no tracks.';
  }

  return (
    <div className="flex h-64 min-h-0 gap-4">
      <div className="flex w-56 shrink-0 flex-col gap-2 border-r border-border pr-4">
        <Text variant="muted">Tracks</Text>
        {selectionNodeName && (
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
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
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
                        'flex w-full min-h-8 shrink-0 items-center gap-2 rounded-sm px-2 py-2 text-left text-xs transition-colors',
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
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {selectedTrackName && trackInView
          ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <KeyframeKeyTable trackName={selectedTrackName} />
              </div>
            )
          : (
              <>
                <Text variant="muted">Keys</Text>
                <Text as="p" variant="muted">
                  Select a track to edit its keyframes.
                </Text>
              </>
            )}
      </div>
    </div>
  );
}
