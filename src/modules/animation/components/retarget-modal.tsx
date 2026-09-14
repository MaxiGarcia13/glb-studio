import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { Modal } from '@/components/modal';
import { Text } from '@/components/text';
import { $clips } from '@/modules/animation/stores/clip-store';
import { $retargetClipId, closeRetarget } from '@/modules/animation/stores/retarget-ui-store';
import { RetargetPanel } from './retarget-panel';

export function RetargetModal() {
  const clipId = useStore($retargetClipId);
  const { clips } = useStore($clips, { keys: ['clips'] });
  const entry = clipId
    ? clips.find((clip) => clip.id === clipId && clip.clip)
    : undefined;

  useEffect(() => {
    if (clipId && !entry) {
      closeRetarget();
    }
  }, [clipId, entry]);

  const open = Boolean(entry);

  return (
    <Modal
      open={open}
      title="Retarget"
      onClose={closeRetarget}
      className="h-[min(90vh,42rem)] max-w-4xl"
    >
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
