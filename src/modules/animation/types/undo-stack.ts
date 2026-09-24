import type { AnimationClip, Texture } from 'three';

import type { BindPoseDelta } from '@/modules/animation/domain/bind-pose-rebase';
import type { CreatePartClipboardNode } from '@/modules/create/types/create-part-clipboard';

/** Stack command ids — distinct from catalog hotkey ids (`undo` / `redo`). */
export type UndoableCommandId
  = | 'trimClip'
    | 'saveKeyframe'
    | 'setTimeScale'
    | 'createHierarchy'
    | 'createScene'
    | 'materialColorMap';

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

/**
 * Scene-graph TRS for a bind-pose Save (no driving clip). Undo/redo must write
 * this back onto the node and rest-pose map — library snapshots alone leave the
 * gizmo pose on the preview.
 */
export interface SaveKeyframeSceneNode {
  modelId: string;
  nodeUuid: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
  /**
   * Parent at commit time. `null` = model scene root. Omitted on legacy
   * mid-session entries — apply leaves parenting unchanged.
   */
  parentUuid?: string | null;
}

/** Create-group / joint identity for hierarchy undo (stable UUID). */
export interface CreateHierarchyGroupSpec {
  uuid: string;
  name: string;
  role: 'group' | 'joint';
}

/** One node’s parent + local TRS in a hierarchy snapshot. */
export interface CreateHierarchyPlacement {
  nodeUuid: string;
  /** `null` = model scene root. */
  parentUuid: string | null;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

/**
 * Create-part parenting commit (Group / Ungroup / Make connector / Unjoint).
 * Apply order: ensureGroups → placements → removeGroupUuids.
 */
export interface CreateHierarchySnapshot {
  modelId: string;
  ensureGroups: readonly CreateHierarchyGroupSpec[];
  removeGroupUuids: readonly string[];
  placements: readonly CreateHierarchyPlacement[];
  selectUuids: readonly string[];
}

/** One create tree root for Add / Paste / Delete undo. */
export interface CreateSceneTreeRoot {
  /** `null` = model scene root. */
  parentUuid: string | null;
  node: CreatePartClipboardNode;
}

/**
 * Create-graph insert/remove commit (Add part / Paste / Delete).
 * Apply order: ensureTrees → removeRootUuids → select.
 */
export interface CreateSceneSnapshot {
  modelId: string;
  ensureTrees: readonly CreateSceneTreeRoot[];
  removeRootUuids: readonly string[];
  selectUuids: readonly string[];
}

export interface SaveKeyframeSnapshot {
  /** One keyframe write, or every clip touched by a bind-pose rebase. */
  clips: readonly SaveKeyframeClipSlice[];
  /** Bind-pose override map written by this commit; omit when unused. */
  bindPoseOverrides?: Record<string, Record<string, BindPoseDelta>>;
  /** Present on bind-pose Saves; omitted for clip keyframe / root TRS commits. */
  sceneNode?: SaveKeyframeSceneNode;
  /** Multi-select position commits — every moved root (supersedes single `sceneNode`). */
  sceneNodes?: readonly SaveKeyframeSceneNode[];
}

export interface TimeScaleSnapshot {
  timeScale: number;
}

/**
 * Color-map commit snapshot. `map` is a stack-owned clone (or null).
 * Dispose only when the stack entry is pruned — not on undo/redo assign.
 */
export interface MaterialColorMapSnapshot {
  map: Texture | null;
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
  }
  | {
    id: 'createHierarchy';
    /** Library model whose create graph changed. */
    modelId: string;
    before: CreateHierarchySnapshot;
    after: CreateHierarchySnapshot;
  }
  | {
    id: 'createScene';
    modelId: string;
    before: CreateSceneSnapshot;
    after: CreateSceneSnapshot;
  }
  | {
    id: 'materialColorMap';
    modelId: string;
    meshUuid: string;
    before: MaterialColorMapSnapshot;
    after: MaterialColorMapSnapshot;
    /**
     * Remove-active: one undo restores wardrobe entry + live map.
     * Texture pixels live on `before.map` (stack-owned clone).
     */
    sessionSkinRemoval?: {
      skinId: string;
      label: string;
      /** Index in `skins[]` before removal. */
      index: number;
    };
  };
