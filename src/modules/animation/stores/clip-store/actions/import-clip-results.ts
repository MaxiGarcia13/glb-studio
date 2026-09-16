import type { ClipEntry, ClipLoadResult } from '@/modules/animation/types/clip';
import { $clips } from '../store';
import { applyActiveModelBindOverrides, nextClipId, toEntry } from '../utils';
import { selectClip } from './select-clip';

/** Commit already-parsed clip results (used by the content router for shared imports). */
export function importClipResults(
  results: ClipLoadResult[],
  ownerModelId: string | null = null,
): void {
  const entries: ClipEntry[] = [];

  for (const result of results) {
    const baseId = nextClipId();
    for (const clip of result.clips) {
      entries.push(applyActiveModelBindOverrides(toEntry(
        { valid: true, error: null },
        baseId,
        clip,
        result.name,
        result.sourceBindLengths,
        result.sourceBindFrames,
        ownerModelId,
      )));
    }
  }

  if (entries.length === 0) {
    return;
  }

  $clips.setKey('clips', [...$clips.get().clips, ...entries]);

  const state = $clips.get();
  if (!state.activeClipId) {
    const firstReady = entries.find((entry) => entry.status === 'ready');
    if (firstReady) {
      selectClip(firstReady.id);
    }
  }
}
