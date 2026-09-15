import { restoreMixerPose } from '@/modules/animation/utils/mixer-session';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $poseDirty,
  $poseEditKind,
  clearPoseDirty,
  restoreFromSnapshot,
} from '@/modules/viewport/stores/pose-edit-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { $clips } from '../store';

/**
 * Discard unsaved gizmo / Settings edits.
 *
 * Always restore the pre-edit snapshot on the edited object. Empty drafts (and
 * clips without tracks for that node) cannot be corrected by mixer.setTime alone,
 * so snapshot restore is required before optionally re-applying the active clip.
 */
export function restorePose(): void {
  if (!$poseDirty.get()) {
    return;
  }

  const kind = $poseEditKind.get();
  const { activeClipId } = $clips.get();
  const model = $activeModel.get();
  const object
    = kind === 'modelRoot'
      ? model?.scene ?? null
      : $selection.get().object;

  if (object) {
    restoreFromSnapshot(object);
  }

  // Created part edits are scene-graph only — do not re-apply a shared clip mixer.
  if (
    kind === 'modelRoot'
    || !activeClipId
    || (kind === 'selection' && model?.source === 'created')
  ) {
    clearPoseDirty();
    return;
  }

  restoreMixerPose();
}
