import type { PartKindId, PartSizeParams } from './part';

/** Kit ids — New model stays `empty`; optional presets are US-27. */
export type KitId = 'empty' | 'simple-building';

export type ColorHex = `#${string}`;

export interface PartRecipe {
  kind: PartKindId;
  name: string;
  /** Local position in metres (Y-up). Identity Y sits on the ground for grounded kinds. */
  position: [number, number, number];
  /** Local Euler XYZ in radians (same as `Object3D.rotation`). */
  rotation: [number, number, number];
  scale?: [number, number, number];
  params: PartSizeParams;
  color: ColorHex;
}

export interface Kit<K extends KitId = KitId> {
  id: K;
  label: string;
  description: string;
  parts: readonly PartRecipe[];
}
