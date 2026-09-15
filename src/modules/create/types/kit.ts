import type { PartKindId, PartSizeParams } from './part';

/** Kit ids — MVP only has empty; more kits arrive in US-27. */
export type KitId = 'empty';

export type ColorHex = `#${string}`;

export interface PartRecipe {
  kind: PartKindId;
  name: string;
  position: [number, number, number];
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
