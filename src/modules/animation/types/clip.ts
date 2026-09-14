import type * as THREE from 'three';

export type ClipStatus = 'ready' | 'error' | 'draft';

/** Rest-pose local TRS frame for a bone (US-18 hips rebase). */
export interface BoneBindFrame {
  localPosition: [number, number, number];
  parentWorldQuaternion: [number, number, number, number];
}

export interface ClipEntry {
  id: string;
  name: string;
  sourceFile: string;
  clip: THREE.AnimationClip | null;
  sourceClip: THREE.AnimationClip | null;
  status: ClipStatus;
  error: string | null;
  /** Playback / export speed multiplier for this clip (default 1). */
  timeScale: number;
  /** Bone name → rest-pose local-position length captured from the source GLB. */
  sourceBindLengths: Record<string, number>;
  /** Bone name → rest-pose local position + parent world quaternion (US-18). */
  sourceBindFrames: Record<string, BoneBindFrame>;
  /** Owning model id; null = shared (listed under Shared Animations). */
  ownerModelId: string | null;
  /**
   * Per-model model-root world position from Move / Settings XYZ while this clip
   * is active on that model. Missing key = use that model’s rest-pose root.
   */
  rootPositionByModelId: Record<string, [number, number, number]>;
}

export interface ClipLibraryState {
  clips: ClipEntry[];
  /** Legacy single-selection — kept as the "focused" clip for trim/blend/playback UI. */
  activeClipId: string | null;
  /** Shared clip playing on all models; when set, per-model selections are cleared. */
  activeSharedClipId: string | null;
  /** Per-model owned clip selection (model id → clip id). */
  activeClipByModelId: Record<string, string | null>;
  /** Primary layer snapshot captured when a blend partner is selected. */
  blendBaseClip: THREE.AnimationClip | null;
  blendClipId: string | null;
  blendWeight: number;
  playing: boolean;
  loop: boolean;
  duration: number;
  trimStart: number;
  trimEnd: number;
}

export interface ClipLoadResult {
  name: string;
  clips: THREE.AnimationClip[];
  /** Bone name → rest-pose local-position length from the source GLB. */
  sourceBindLengths: Record<string, number>;
  /** Bone name → rest-pose local position + parent world quaternion from the source GLB. */
  sourceBindFrames: Record<string, BoneBindFrame>;
}
