import type { Kit, KitId } from '@/modules/create/types/kit';
import { BLOCK_ROBOT_SKINNED_KIT } from './kits/block-robot-skinned';
import { SIMPLE_BUILDING_KIT } from './kits/simple-building';

/** Starter kits. New model always uses empty; From kit is a separate entry (US-27 / US-33). */
export const KITS: { [K in KitId]: Kit<K> } = {
  'empty': {
    id: 'empty',
    label: 'Empty',
    description: 'Blank scene — add parts from the create tools.',
    parts: [],
  },
  'simple-building': SIMPLE_BUILDING_KIT,
  'block-robot': BLOCK_ROBOT_SKINNED_KIT,
};

export function getKit<K extends KitId>(id: K): Kit<K> {
  return KITS[id];
}

function listKits(): Kit[] {
  return Object.values(KITS);
}

/** Starter presets for From kit — excludes the empty New model kit. */
export function listStarterKits(): Array<Kit<Exclude<KitId, 'empty'>>> {
  return listKits().filter(
    (kit): kit is Kit<Exclude<KitId, 'empty'>> => kit.id !== 'empty',
  );
}
