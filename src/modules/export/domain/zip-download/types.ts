import type { ExportFormat } from '@/modules/export/utils/file-name';

/** Zip entry layout. `folders` nests each ungrouped model (US-49). */
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
