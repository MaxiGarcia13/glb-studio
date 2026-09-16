import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { RestoreIcon } from '@/components/icons/restore-icon';
import { SaveIcon } from '@/components/icons/save-icon';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $poseDirty, $poseEditKind } from '@/modules/viewport/stores/pose-edit-store';
import { $clips, restorePose, saveKeyframe } from '../stores/clip-store';

interface SaveKeyframeButtonProps {
  className?: string;
}

export function SaveKeyframeButton({ className }: SaveKeyframeButtonProps) {
  const { activeClipId } = useStore($clips, { keys: ['activeClipId'] });
  const poseDirty = useStore($poseDirty);
  const poseEditKind = useStore($poseEditKind);
  const { scene, activeModel } = useActiveModel();

  // Created parts always commit scene TRS (US-23) — never Hold Pose keyframes.
  const writeKeyframe
    = poseEditKind === 'selection'
      && activeClipId !== null
      && activeModel?.source !== 'created';
  const clipRootSave = poseEditKind === 'modelRoot' && activeClipId !== null;

  if (!poseDirty || scene === null) {
    return null;
  }

  const saveLabel = writeKeyframe ? 'Hold pose to end of clip' : 'Save edit';
  const saveTitle = writeKeyframe
    ? 'Keeps this pose from the playhead to the end of the clip. Scrub and edit again anytime to change it.'
    : clipRootSave
      ? 'Saves this model root position on the selected animation only.'
      : 'Commits the current transform onto the model.';

  return (
    <FloatingToolbar aria-label="Pose edit" className={cn(className)}>
      <Button
        variant="ghost"
        onClick={restorePose}
        aria-label="Restore edit"
        title="Restore edit"
      >
        <RestoreIcon aria-hidden />
      </Button>
      <Button
        variant="primary"
        onClick={() => saveKeyframe({ holdToEnd: writeKeyframe })}
        aria-label={saveLabel}
        title={saveTitle}
      >
        <SaveIcon aria-hidden />
      </Button>
    </FloatingToolbar>
  );
}
