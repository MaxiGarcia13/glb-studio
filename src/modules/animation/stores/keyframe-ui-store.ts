import { atom } from 'nanostores';

/** Selected track by `KeyframeTrack.name` within the active clip; `null` if none. */
export const $selectedTrackName = atom<string | null>(null);

/** Selected key index on `$selectedTrackName`; `null` if none. */
export const $selectedKeyIndex = atom<number | null>(null);

export function selectKeyframeTrack(name: string | null): void {
  if ($selectedTrackName.get() !== name) {
    $selectedTrackName.set(name);
  }
  if ($selectedKeyIndex.get() !== null) {
    $selectedKeyIndex.set(null);
  }
}

export function selectKeyframeKey(index: number | null): void {
  if ($selectedKeyIndex.get() === index) {
    return;
  }
  $selectedKeyIndex.set(index);
}

/** Drop track + key selection (clip change / track removed from filter). */
export function clearKeyframeTrackSelection(): void {
  if ($selectedTrackName.get() !== null) {
    $selectedTrackName.set(null);
  }
  if ($selectedKeyIndex.get() !== null) {
    $selectedKeyIndex.set(null);
  }
}
