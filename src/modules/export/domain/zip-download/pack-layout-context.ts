import type { ClipEntry } from '@/modules/animation/types/clip';
import type { SessionSkinsByModel, SessionSkinWardrobe } from '@/modules/create/types/session-skins';
import type { ZipEntry } from '@/modules/export/adapters/zip';
import type { ExportFormat } from '@/modules/export/utils/file-name';

export const EMPTY_SESSION_WARDROBE: SessionSkinWardrobe = {
  skins: [],
  activeSkinId: null,
};

/** Shared inputs for flat / folders unit packing (store-free). */
export interface PackLayoutContext {
  clips: readonly ClipEntry[];
  format: ExportFormat;
  modelFileNames: Record<string, string>;
  groupFileNames: Record<string, string>;
  sessionSkinsByModel: SessionSkinsByModel;
}

export interface PackLayoutResult {
  entries: ZipEntry[];
  /** Shared clip ids already written under a model’s `animations/` (folders only). */
  packedSharedClipIds: ReadonlySet<string>;
}
