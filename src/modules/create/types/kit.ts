import type { PartKindId, PartSizeParams } from './part';

/** Kit ids — New model stays `empty`; optional presets are US-27 / US-33. */
export type KitId
  = | 'empty'
    | 'simple-building'
    | 'block-robot';

export type ColorHex = `#${string}`;

/**
 * Empty create-group node for kit hierarchy (outliner / parenting).
 * Not a skinned armature — stamped `createGroup` only.
 */
export interface GroupRecipe {
  name: string;
  /** Parent group name; omit for a direct child of the model root. */
  parent?: string;
  /** World position in metres (converted to local when nested). */
  position: [number, number, number];
  /** World Euler XYZ in radians. */
  rotation?: [number, number, number];
}

export interface PartRecipe {
  kind: PartKindId;
  name: string;
  /** Parent group name; omit for a direct child of the model root. */
  parent?: string;
  /** World position in metres (Y-up). Identity Y sits on the ground for grounded kinds. */
  position: [number, number, number];
  /** World Euler XYZ in radians (same as `Object3D.rotation`). */
  rotation: [number, number, number];
  scale?: [number, number, number];
  params: PartSizeParams;
  color: ColorHex;
}

export interface SkinnedKitAsset {
  /** Stable URL under `public/kits/` (e.g. `/kits/block-robot.glb`). */
  url: string;
  /** Library row file name when spawning (e.g. `Block robot.glb`). */
  defaultFileName?: string;
}

interface KitMeta<K extends KitId = KitId> {
  id: K;
  label: string;
  description: string;
}

/** Mesh + optional create-group recipe (created-model path). */
export interface MeshKit<K extends KitId = KitId> extends KitMeta<K> {
  groups?: readonly GroupRecipe[];
  parts: readonly PartRecipe[];
}

/** Pre-skinned GLB asset (imported-model path). */
export interface SkinnedKit<K extends KitId = KitId> extends KitMeta<K> {
  skinnedAsset: SkinnedKitAsset;
}

export type Kit<K extends KitId = KitId> = MeshKit<K> | SkinnedKit<K>;
