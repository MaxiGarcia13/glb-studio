import { atom } from 'nanostores';

/** Bumped when created-model part membership or hierarchy changes. */
export const $createPartsRevision = atom(0);

export function bumpCreatePartsRevision(): void {
  $createPartsRevision.set($createPartsRevision.get() + 1);
}
