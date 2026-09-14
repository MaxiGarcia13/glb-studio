import { atom } from 'nanostores';
import { $model } from '@/modules/viewport/stores/model-store';

/** Clip id currently open in the Retarget modal; `null` when closed. */
export const $retargetClipId = atom<string | null>(null);

/** Model the retarget result should be owned by (defaults to focused preview model). */
export const $retargetTargetModelId = atom<string | null>(null);

export function openRetarget(clipId: string, targetModelId?: string | null): void {
  $retargetClipId.set(clipId);
  $retargetTargetModelId.set(targetModelId ?? $model.get().activeModelId);
}

export function closeRetarget(): void {
  if ($retargetClipId.get() !== null) {
    $retargetClipId.set(null);
  }
  $retargetTargetModelId.set(null);
}
