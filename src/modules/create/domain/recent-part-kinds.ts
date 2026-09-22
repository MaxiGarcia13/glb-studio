import type { PartKindId } from '@/modules/create/types/part';
import { DEFAULT_PART_SUGGESTION_ORDER } from '@/modules/create/constants/default-part-suggestions';
import { setStoredString, STORAGE_KEYS } from '@/utils/local-storage';

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

/** Prepend `kindId`, drop duplicates, truncate to the compact-menu window. */
export function prependRecentKind(
  recent: readonly PartKindId[],
  kindId: PartKindId,
): PartKindId[] {
  return [
    kindId,
    ...recent.filter((id) => id !== kindId),
  ].slice(0, COMPACT_MENU_KIND_COUNT);
}

/**
 * Record a used kind as most-recent and persist the MRU window to localStorage.
 * Returns the updated list (newest first).
 */
export function recordRecentKind(
  recent: readonly PartKindId[],
  kindId: PartKindId,
): PartKindId[] {
  const next = prependRecentKind(recent, kindId);
  setStoredString(STORAGE_KEYS.recentPartKinds, JSON.stringify(next));
  return next;
}
