import type { PartKindId, PartSizeParams } from './part';

/** Kit ids — New model stays `empty`; optional presets are US-27. */
export type KitId = 'empty' | 'simple-building' | 'block-robot';

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

export interface Kit<K extends KitId = KitId> {
  id: K;
  label: string;
  description: string;
  /** Optional armature-style group tree (declared parents before children). */
  groups?: readonly GroupRecipe[];
  parts: readonly PartRecipe[];
}
