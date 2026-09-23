import { atom } from 'nanostores';

/**
 * Bumped when a live material color map changes (apply / clear / undo / redo)
 * so React chrome can re-read `material.map` without relying on object identity.
 */
export const $materialMapsRevision = atom(0);

export function bumpMaterialMapsRevision(): void {
  $materialMapsRevision.set($materialMapsRevision.get() + 1);
}
