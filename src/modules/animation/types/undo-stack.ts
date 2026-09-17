import type { AnimationClip } from 'three';

import type { BindPoseDelta } from '@/modules/animation/domain/bind-pose-rebase';

/** Stack command ids — distinct from catalog hotkey ids (`undo` / `redo`). */
export type UndoableCommandId = 'trimClip' | 'saveKeyframe' | 'setTimeScale';

export interface TrimClipSnapshot {
  clip: AnimationClip;
  trimStart: number;
  trimEnd: number;
  duration: number;
}

/**
 * Fields replaced on one library entry. Omit a field when this commit did not
 * mutate it (apply replaces only defined keys).
 */
export interface SaveKeyframeClipSlice {
  clipId: string;
  clip?: AnimationClip;
  sourceClip?: AnimationClip | null;
  rootPositionByModelId?: Record<string, [number, number, number]>;
  rootRotationByModelId?: Record<string, [number, number, number]>;
  rootScaleByModelId?: Record<string, [number, number, number]>;
}

export interface SaveKeyframeSnapshot {
  /** One keyframe write, or every clip touched by a bind-pose rebase. */
  clips: readonly SaveKeyframeClipSlice[];
  /** Bind-pose override map written by this commit; omit when unused. */
  bindPoseOverrides?: Record<string, Record<string, BindPoseDelta>>;
}

export interface TimeScaleSnapshot {
  timeScale: number;
}

/** One committed edit on the session stack. */
export type UndoableCommand
  = | {
    id: 'trimClip';
    /** Library entry the user committed against. */
    clipId: string;
    before: TrimClipSnapshot;
    after: TrimClipSnapshot;
  }
  | {
    id: 'saveKeyframe';
    clipId: string;
    before: SaveKeyframeSnapshot;
    after: SaveKeyframeSnapshot;
  }
  | {
    id: 'setTimeScale';
    clipId: string;
    before: TimeScaleSnapshot;
    after: TimeScaleSnapshot;
  };
