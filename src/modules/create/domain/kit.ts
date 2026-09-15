import type { Kit, KitId } from '@/modules/create/types/kit';

/** Starter kits. New model always uses empty; other kits are registered in US-27+. */
export const KITS: { [K in KitId]: Kit<K> } = {
  empty: {
    id: 'empty',
    label: 'Empty',
    description: 'Blank scene — add parts from the create tools.',
    parts: [],
  },
};

export function getKit<K extends KitId>(id: K): Kit<K> {
  return KITS[id];
}

export function listKits(): Kit[] {
  return Object.values(KITS);
}
