import { cn } from '@maxigarcia/js-utils';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/button';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { RestoreIcon } from '@/components/icons/restore-icon';
import { SaveIcon } from '@/components/icons/save-icon';
import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $poseDirty, $poseEditKind } from '@/modules/viewport/stores/pose-edit-store';
import { $clips, isReadyClip, restorePose, saveKeyframe } from '../stores/clip-store';

interface SaveKeyframeButtonProps {
  className?: string;
}

export function SaveKeyframeButton({ className }: SaveKeyframeButtonProps) {
  const {
    clips,
    activeClipId,
    activeClipByModelId,
    activeSharedClipId,
  } = useStore($clips, {
    keys: ['clips', 'activeClipId', 'activeClipByModelId', 'activeSharedClipId'],
  });
  const poseDirty = useStore($poseDirty);
  const poseEditKind = useStore($poseEditKind);
  const { scene, activeModel } = useActiveModel();

  const drivingClipId = activeModel
    ? resolveActiveClipIdForModel(
        clips,
        activeModel.id,
        activeClipByModelId,
        activeSharedClipId,
      ) ?? activeClipId
    : activeClipId;
  const drivingClip = drivingClipId
    ? clips.find((entry) => entry.id === drivingClipId)
    : undefined;
  const hasReadyDrivingClip = isReadyClip(drivingClip);

  // Hold Pose when a ready clip drives the edit. Created models without a clip
  // stay scene-TRS-only (US-23).
  const writeKeyframe
    = poseEditKind === 'selection' && hasReadyDrivingClip;
  const clipRootSave = poseEditKind === 'modelRoot' && hasReadyDrivingClip;

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
