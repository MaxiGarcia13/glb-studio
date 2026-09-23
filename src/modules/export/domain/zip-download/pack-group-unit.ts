import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ExportFormat } from '@/modules/export/utils/file-name';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

import { resolveExportFileName } from '@/modules/export/utils/file-name';
import { packMergedModelsGlb } from '../merged-glb';

export interface PackedGroupUnit {
  arrayBuffer: ArrayBuffer;
  /** Sanitized `{basename}.{format}` before zip uniquify / folder wrap. */
  resolvedFileName: string;
}

/** Pack a multi-model group GLB and resolve its export basename. */
export async function packGroupUnit(
  models: readonly ModelEntry[],
  clips: readonly ClipEntry[],
  group: ModelGroup,
  format: ExportFormat,
  preferredFileName?: string,
): Promise<PackedGroupUnit> {
  const packed = await packMergedModelsGlb(models, clips, {
    rootName: group.name,
  });
  const fallback = `${group.name}.${format}`;
  const resolvedFileName = resolveExportFileName(
    preferredFileName,
    fallback,
    format,
  );
  return { arrayBuffer: packed.arrayBuffer, resolvedFileName };
}
