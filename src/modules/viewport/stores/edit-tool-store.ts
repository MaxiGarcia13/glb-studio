import { atom } from 'nanostores';
import { restorePose } from '@/modules/animation/stores/clip-store';
import { $poseDirty } from './pose-edit-store';

export type EditTool = 'navigate' | 'edit' | 'move';

export const $editTool = atom<EditTool>('edit');

export function setEditTool(tool: EditTool): void {
  const current = $editTool.get();
  if (current === tool) {
    return;
  }
  if ($poseDirty.get()) {
    restorePose();
  }
  $editTool.set(tool);
}
