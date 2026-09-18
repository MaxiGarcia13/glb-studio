import { atom } from 'nanostores';

/** Settings Keys filter: selected bone/mesh vs every track on the active clip. */
export type KeyframeTrackFilter = 'selected' | 'all';

export const $keyframeTrackFilter = atom<KeyframeTrackFilter>('selected');

/** Selected track by `KeyframeTrack.name` within the active clip; `null` if none. */
export const $selectedTrackName = atom<string | null>(null);

export function setKeyframeTrackFilter(filter: KeyframeTrackFilter): void {
  $keyframeTrackFilter.set(filter);
}

export function selectKeyframeTrack(name: string | null): void {
  if ($selectedTrackName.get() === name) {
    return;
  }
  $selectedTrackName.set(name);
}

/** Drop track selection (clip change / track removed from filter). */
export function clearKeyframeTrackSelection(): void {
  if ($selectedTrackName.get() !== null) {
    $selectedTrackName.set(null);
  }
}
