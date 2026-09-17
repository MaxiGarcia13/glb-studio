import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';

/** In-session create-part clipboard snapshot (US-10). Not the OS clipboard. */
export interface CreatePartClipboardEntry {
  kind: PartKindId;
  params: PartSizeParams;
  /** `#rrggbb` from MeshStandardMaterial when present. */
  colorHex: string | null;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}
