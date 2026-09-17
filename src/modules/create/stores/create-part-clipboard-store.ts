import type { CreatePartClipboardEntry } from '../types/create-part-clipboard';

import { atom } from 'nanostores';

/** Session-only create-part clipboard; cleared on reload. */
export const $createPartClipboard = atom<CreatePartClipboardEntry | null>(null);

export function setCreatePartClipboard(
  entry: CreatePartClipboardEntry | null,
): void {
  $createPartClipboard.set(entry);
}
