import type { PackLayoutContext, PackLayoutResult } from './pack-layout-context';
import type { ExportUnit } from './resolve-export-units';
import type { ZipEntry } from '@/modules/export/adapters/zip';

import {
  resolveExportFileName,
  stripExportExtension,
  uniqueFileName,
} from '@/modules/export/utils/file-name';
import { packFolderModelEntries } from './pack-folder-model-entries';
import { packGroupUnit } from './pack-group-unit';
import { EMPTY_SESSION_WARDROBE } from './pack-layout-context';
import { joinZipPath, uniquePathSegment } from './zip-path';

/**
 * Folder zip layout: ungrouped models as `{Base}/…`; groups as
 * `{GroupBase}/{GroupBase}.{ext}` (members not split).
 * Shared clips under `animations/` are reported for orchestrator dedupe.
 */
export async function packFoldersExportEntries(
  units: readonly ExportUnit[],
  context: PackLayoutContext,
): Promise<PackLayoutResult> {
  const { clips, format, modelFileNames, groupFileNames, sessionSkinsByModel }
    = context;
  const takenNames = new Set<string>();
  const takenFolderBases = new Set<string>();
  const entries: ZipEntry[] = [];
  const packedSharedClipIds = new Set<string>();

  for (const unit of units) {
    if (unit.kind === 'group' && unit.group) {
      const packed = await packGroupUnit(
        unit.models,
        clips,
        unit.group,
        format,
        groupFileNames[unit.group.id],
      );
      const folderBase = uniquePathSegment(
        stripExportExtension(packed.resolvedFileName),
        takenFolderBases,
      );
      const fileName = uniqueFileName(
        joinZipPath(
          folderBase,
          resolveExportFileName(undefined, `${folderBase}.${format}`, format),
        ),
        takenNames,
      );
      takenNames.add(fileName);
      entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
      continue;
    }

    const model = unit.models[0];
    if (!model) {
      continue;
    }

    const folderPack = await packFolderModelEntries({
      model,
      clips,
      format,
      modelFileName: modelFileNames[model.id],
      takenNames,
      takenFolderBases,
      sessionWardrobe: sessionSkinsByModel[model.id] ?? EMPTY_SESSION_WARDROBE,
    });
    entries.push(...folderPack.entries);
    for (const id of folderPack.packedSharedClipIds) {
      packedSharedClipIds.add(id);
    }
  }

  return { entries, packedSharedClipIds };
}
