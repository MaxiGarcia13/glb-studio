import type { PartKindId, PartSizeParams } from '@/modules/create/types/part';

/** Local TRS snapshot shared by part and group clipboard nodes. */
export interface CreatePartClipboardTrs {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

/** Stamped create-part mesh in the session clipboard. */
export interface CreatePartClipboardPartNode extends CreatePartClipboardTrs {
  type: 'part';
  kind: PartKindId;
  params: PartSizeParams;
  /** `#rrggbb` from MeshStandardMaterial when present. */
  colorHex: string | null;
}

/** Create-group subtree in the session clipboard. */
export interface CreatePartClipboardGroupNode extends CreatePartClipboardTrs {
  type: 'group';
  children: CreatePartClipboardNode[];
}

export type CreatePartClipboardNode =
  | CreatePartClipboardPartNode
  | CreatePartClipboardGroupNode;

/**
 * In-session create-part clipboard payload (US-10). Not the OS clipboard.
 * One or more root trees (single part, group, or multi-select).
 */
export interface CreatePartClipboardPayload {
  roots: CreatePartClipboardNode[];
}
