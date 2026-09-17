import type { BindPoseDelta } from '@/modules/animation/domain/bind-pose-rebase';
import { atom } from 'nanostores';
import { composeBindPoseDeltas } from '@/modules/animation/domain/bind-pose-rebase';

/** Per-model accumulated bind-pose deltas, keyed by node name. */
export type BindPoseOverridesByModel = Record<string, Record<string, BindPoseDelta>>;

export const $bindPoseOverrides = atom<BindPoseOverridesByModel>({});

export function getBindPoseOverrides(modelId: string): Readonly<Record<string, BindPoseDelta>> {
  return $bindPoseOverrides.get()[modelId] ?? {};
}

export function accumulateBindPoseDelta(
  modelId: string,
  nodeName: string,
  delta: BindPoseDelta,
): void {
  const all = $bindPoseOverrides.get();
  const forModel = { ...(all[modelId] ?? {}) };
  const existing = forModel[nodeName];
  forModel[nodeName] = existing ? composeBindPoseDeltas(existing, delta) : delta;
  $bindPoseOverrides.set({ ...all, [modelId]: forModel });
}

export function clearBindPoseOverrides(modelId: string): void {
  const all = $bindPoseOverrides.get();
  if (!(modelId in all)) {
    return;
  }
  const next = { ...all };
  delete next[modelId];
  $bindPoseOverrides.set(next);
}

/** Move a node’s bind-pose delta key when the Object3D is renamed. */
export function renameBindPoseNode(
  modelId: string,
  fromName: string,
  toName: string,
): void {
  if (!fromName || fromName === toName) {
    return;
  }
  const all = $bindPoseOverrides.get();
  const forModel = all[modelId];
  if (!forModel || !(fromName in forModel)) {
    return;
  }
  const nextForModel = { ...forModel };
  const delta = nextForModel[fromName];
  delete nextForModel[fromName];
  // Prefer keeping an existing target key if somehow both exist.
  if (!(toName in nextForModel)) {
    nextForModel[toName] = delta;
  }
  $bindPoseOverrides.set({ ...all, [modelId]: nextForModel });
}

export function clearAllBindPoseOverrides(): void {
  if (Object.keys($bindPoseOverrides.get()).length === 0) {
    return;
  }
  $bindPoseOverrides.set({});
}

/** Replace the whole map (undo/redo of a bind-pose save). */
export function replaceBindPoseOverrides(next: BindPoseOverridesByModel): void {
  $bindPoseOverrides.set(next);
}
