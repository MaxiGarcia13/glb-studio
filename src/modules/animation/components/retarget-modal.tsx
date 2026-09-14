import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { $clips } from '@/modules/animation/stores/clip-store';
import {
  $retargetCandidateIds,
  $retargetClipId,
  closeRetarget,
  selectRetargetCandidate,
} from '@/modules/animation/stores/retarget-ui-store';
import { RetargetPanel } from './retarget-panel';

function RetargetClipPicker({
  candidateIds,
  clips,
}: {
  candidateIds: string[];
  clips: { id: string; name: string; clip: unknown }[];
}) {
  const options = candidateIds.flatMap((id) => {
    const entry = clips.find((clip) => clip.id === id && clip.clip);
    return entry ? [{ value: entry.id, label: entry.name }] : [];
  });
  const [draftId, setDraftId] = useState(options[0]?.value ?? '');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text as="h2" variant="section">
          Choose animation
        </Text>
        <Text variant="muted">
          Select which mismatched clip to retarget for this model.
        </Text>
      </div>
      <Select
        value={draftId}
        onChange={(event) => setDraftId(event.target.value)}
        aria-label="Clip to retarget"
        placeholder="Choose animation…"
        options={options}
      />
      <div className="flex justify-end gap-2">
        <Button variant="default" onClick={closeRetarget}>
          Cancel
        </Button>
        <Button
          variant={draftId ? 'primary' : 'default'}
          disabled={!draftId}
          onClick={() => selectRetargetCandidate(draftId)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

export function RetargetModal() {
  const clipId = useStore($retargetClipId);
  const candidateIds = useStore($retargetCandidateIds);
  const { clips } = useStore($clips, { keys: ['clips'] });
  const entry = clipId
    ? clips.find((clip) => clip.id === clipId && clip.clip)
    : undefined;

  const picking = candidateIds !== null && clipId === null;
  const open = Boolean(entry) || picking;

  useEffect(() => {
    if (clipId && !entry) {
      closeRetarget();
    }
  }, [clipId, entry]);

  useEffect(() => {
    if (!picking || !candidateIds) {
      return;
    }
    const stillValid = candidateIds.some((id) =>
      clips.some((clip) => clip.id === id && clip.clip),
    );
    if (!stillValid) {
      closeRetarget();
    }
  }, [picking, candidateIds, clips]);

  return (
    <Modal
      open={open}
      title="Retarget"
      onClose={closeRetarget}
      className={picking ? 'max-w-md' : 'h-[min(90vh,42rem)] max-w-4xl'}
    >
      {picking && candidateIds && (
        <RetargetClipPicker
          key={candidateIds.join('|')}
          candidateIds={candidateIds}
          clips={clips}
        />
      )}
      {entry && (
        <div className="flex flex-col gap-3 min-h-0 flex-1 h-full">
          <div className="flex flex-col gap-1 shrink-0">
            <Text as="h2" variant="section">
              Map bones
            </Text>
            <Text variant="heading" size="sm" className="truncate" title={entry.name}>
              {entry.name}
            </Text>
          </div>
          <RetargetPanel
            entry={entry}
            onComplete={closeRetarget}
            onCancel={closeRetarget}
          />
        </div>
      )}
    </Modal>
  );
}
