import { atom } from 'nanostores';
import { commitPendingPose } from '@/modules/animation/stores/clip-store/actions/commit-pending-pose';
import { $poseDirty } from './pose-edit-store';

export type EditTool = 'navigate' | 'edit' | 'move';

export const $editTool = atom<EditTool>('edit');

export function setEditTool(tool: EditTool): void {
  const current = $editTool.get();
  if (current === tool) {
    return;
  }
  if ($poseDirty.get()) {
    commitPendingPose();
  }
  $editTool.set(tool);
}
