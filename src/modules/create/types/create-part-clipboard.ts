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
  /** Stable Object3D.uuid when snapshotting for undo. */
  uuid?: string;
  /** Exact display name when restoring via undo (omit on user Copy). */
  name?: string;
}

/** Create-group / joint subtree in the session clipboard. */
export interface CreatePartClipboardGroupNode extends CreatePartClipboardTrs {
  type: 'group';
  /** Organizational group vs skeleton joint (default `group` when omitted). */
  role?: 'group' | 'joint';
  /** Preserved display name base for joints when pasting. */
  name?: string;
  children: CreatePartClipboardNode[];
  /** Stable Object3D.uuid when snapshotting for undo. */
  uuid?: string;
}

export type CreatePartClipboardNode
  = | CreatePartClipboardPartNode
    | CreatePartClipboardGroupNode;

/**
 * In-session create-part clipboard payload. Not the OS clipboard.
 * One or more root trees (single part, group, or multi-select).
 */
export interface CreatePartClipboardPayload {
  roots: CreatePartClipboardNode[];
}
