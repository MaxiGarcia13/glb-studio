import { atom } from 'nanostores';
import { $model } from '@/modules/viewport/stores/model-store';

/** Clip id currently open in the Retarget modal bone map; `null` when closed or on picker step. */
export const $retargetClipId = atom<string | null>(null);

/** Model the retarget result should be owned by (defaults to focused preview model). */
export const $retargetTargetModelId = atom<string | null>(null);

/**
 * Conflicted clip ids when Retarget was opened from a model header.
 * Non-null → show picker before bone map when more than one candidate (or until a clip is chosen).
 */
export const $retargetCandidateIds = atom<string[] | null>(null);

/** Clip-row Retarget — skip picker, open bone map for this clip. */
export function openRetarget(clipId: string, targetModelId?: string | null): void {
  $retargetCandidateIds.set(null);
  $retargetClipId.set(clipId);
  $retargetTargetModelId.set(targetModelId ?? $model.get().activeModelId);
}

/**
 * Model-header Retarget — with multiple conflicts, open picker first;
 * with one conflict, go straight to bone map.
 */
export function openRetargetForModel(
  targetModelId: string,
  candidateIds: string[],
): void {
  const unique = [...new Set(candidateIds.filter(Boolean))];
  if (unique.length === 0) {
    return;
  }

  $retargetTargetModelId.set(targetModelId);

  if (unique.length === 1) {
    $retargetCandidateIds.set(null);
    $retargetClipId.set(unique[0]);
    return;
  }

  $retargetCandidateIds.set(unique);
  $retargetClipId.set(null);
}

/** Advance from model-header picker to bone map. */
export function selectRetargetCandidate(clipId: string): void {
  const candidates = $retargetCandidateIds.get();
  if (!candidates?.includes(clipId)) {
    return;
  }
  $retargetClipId.set(clipId);
}

export function closeRetarget(): void {
  if ($retargetClipId.get() !== null) {
    $retargetClipId.set(null);
  }
  if ($retargetCandidateIds.get() !== null) {
    $retargetCandidateIds.set(null);
  }
  $retargetTargetModelId.set(null);
}
