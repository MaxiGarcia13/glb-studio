import type { CreatePartClipboardPayload } from '../types/create-part-clipboard';

import { atom } from 'nanostores';

/** Session-only create-part clipboard; cleared on reload. */
export const $createPartClipboard = atom<CreatePartClipboardPayload | null>(null);

export function setCreatePartClipboard(
  payload: CreatePartClipboardPayload | null,
): void {
  $createPartClipboard.set(payload);
}
