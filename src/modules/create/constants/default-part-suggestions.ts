import type { PartKindId } from '@/modules/create/types/part';

/**
 * Cold-start / fill order for the compact Add-part menu (US-38).
 * Unused defaults pad MRU slots until five distinct kinds have been used.
 */
export const DEFAULT_PART_SUGGESTION_ORDER = [
  'box',
  'sphere',
  'capsule',
  'dodecahedron',
  'cone',
] as const satisfies readonly PartKindId[];

export type DefaultPartSuggestionId
  = (typeof DEFAULT_PART_SUGGESTION_ORDER)[number];
