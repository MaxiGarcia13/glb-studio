import type { ClipEntry } from '@/modules/animation/types/clip';
import type { SessionSkinsByModel } from '@/modules/create/types/session-skins';
import type { ExportFormat } from '@/modules/export/utils/file-name';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

/** Zip entry layout. `folders` nests each ungrouped model. */
export type ExportZipLayout = 'flat' | 'folders';

export interface ExportZipOptions {
  /** Download name for the zip archive (`.zip` appended if missing). */
  zipFileName?: string;
  /** Per model-group id → basename for that group's packed file. */
  groupFileNames?: Record<string, string>;
  /** Per model id → basename when the model is not in a multi-model group. */
  modelFileNames?: Record<string, string>;
  /** Zip entry format. Default `glb` (browser-only). `fbx` converts each packed GLB. */
  format?: ExportFormat;
  /** Default `flat`. `folders` → `{Base}/{Base}.{ext}` + animations/ + skins/. */
  layout?: ExportZipLayout;
}

/** Store-free pack input. Hook / action resolves nanostores → this snapshot. */
export interface DownloadExportZipInput {
  models: readonly ModelEntry[];
  clips: readonly ClipEntry[];
  groups: readonly ModelGroup[];
  /** Active model for shared-clip skeleton fallback. */
  activeModel: ModelEntry | null;
  /** Session wardrobes keyed by model id (empty object when none). */
  sessionSkinsByModel: SessionSkinsByModel;
  options?: ExportZipOptions;
}
