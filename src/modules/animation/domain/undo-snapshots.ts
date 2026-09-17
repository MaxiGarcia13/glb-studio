import type { AnimationClip } from 'three';

import type { BindPoseDelta } from './bind-pose-rebase';
import type { ClipEntry } from '@/modules/animation/types/clip';

import type {
  SaveKeyframeClipSlice,
  SaveKeyframeSnapshot,
  TrimClipSnapshot,
} from '@/modules/animation/types/undo-stack';

export function cloneVec3Map(
  map: Record<string, [number, number, number]>,
): Record<string, [number, number, number]> {
  const next: Record<string, [number, number, number]> = {};
  for (const [key, value] of Object.entries(map)) {
    next[key] = [value[0], value[1], value[2]];
  }
  return next;
}

export function cloneBindPoseOverrides(
  map: Record<string, Record<string, BindPoseDelta>>,
): Record<string, Record<string, BindPoseDelta>> {
  const next: Record<string, Record<string, BindPoseDelta>> = {};
  for (const [modelId, nodes] of Object.entries(map)) {
    const clonedNodes: Record<string, BindPoseDelta> = {};
    for (const [nodeName, delta] of Object.entries(nodes)) {
      clonedNodes[nodeName] = {
        position: [delta.position[0], delta.position[1], delta.position[2]],
        quaternion: [
          delta.quaternion[0],
          delta.quaternion[1],
          delta.quaternion[2],
          delta.quaternion[3],
        ],
        scale: [delta.scale[0], delta.scale[1], delta.scale[2]],
      };
    }
    next[modelId] = clonedNodes;
  }
  return next;
}

export function snapshotTrimClip(
  clip: AnimationClip,
  trimStart: number,
  trimEnd: number,
  duration: number,
): TrimClipSnapshot {
  return {
    clip: clip.clone(),
    trimStart,
    trimEnd,
    duration,
  };
}

export function snapshotSaveKeyframeClip(entry: ClipEntry): SaveKeyframeClipSlice | null {
  if (!entry.clip) {
    return null;
  }
  return {
    clipId: entry.id,
    clip: entry.clip.clone(),
  };
}

export function snapshotSaveKeyframeRoots(entry: ClipEntry): SaveKeyframeClipSlice {
  return {
    clipId: entry.id,
    rootPositionByModelId: cloneVec3Map(entry.rootPositionByModelId),
    rootRotationByModelId: cloneVec3Map(entry.rootRotationByModelId),
    rootScaleByModelId: cloneVec3Map(entry.rootScaleByModelId),
  };
}

export function snapshotSaveKeyframeBindPoseCommit(
  entries: readonly ClipEntry[],
  bindPoseOverrides: Record<string, Record<string, BindPoseDelta>>,
): SaveKeyframeSnapshot {
  const clips: SaveKeyframeClipSlice[] = [];
  for (const entry of entries) {
    if (!entry.clip) {
      continue;
    }
    clips.push({
      clipId: entry.id,
      clip: entry.clip.clone(),
      sourceClip: entry.sourceClip?.clone() ?? null,
    });
  }
  return {
    clips,
    bindPoseOverrides: cloneBindPoseOverrides(bindPoseOverrides),
  };
}
