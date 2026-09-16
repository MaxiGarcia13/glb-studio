import type { Kit, KitId } from '@/modules/create/types/kit';
import { BLOCK_ROBOT_KIT } from './kits/block-robot';
import { SIMPLE_BUILDING_KIT } from './kits/simple-building';

/** Starter kits. New model always uses empty; From kit is a separate entry (US-27). */
export const KITS: { [K in KitId]: Kit<K> } = {
  'empty': {
    id: 'empty',
    label: 'Empty',
    description: 'Blank scene — add parts from the create tools.',
    parts: [],
  },
  'simple-building': SIMPLE_BUILDING_KIT,
  'block-robot': BLOCK_ROBOT_KIT,
};

export function getKit<K extends KitId>(id: K): Kit<K> {
  return KITS[id];
}

export function listKits(): Kit[] {
  return Object.values(KITS);
}
