import type { PartKindId } from '@/modules/create/types/part';
import { DEFAULT_PART_SUGGESTION_ORDER } from '@/modules/create/constants/default-part-suggestions';

/** Compact Add-part menu always shows this many kind rows. */
export const COMPACT_MENU_KIND_COUNT = 5;

/**
 * Build the five compact-menu kind ids: MRU first (newest first), then unused
 * defaults in default order. Duplicates in `recent` are skipped.
 */
export function resolveCompactMenuKinds(
  recent: readonly PartKindId[],
): PartKindId[] {
  const result: PartKindId[] = [];
  const seen = new Set<PartKindId>();

  for (const id of [...recent, ...DEFAULT_PART_SUGGESTION_ORDER]) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
    if (result.length === COMPACT_MENU_KIND_COUNT) {
      break;
    }
  }

  return result;
}
