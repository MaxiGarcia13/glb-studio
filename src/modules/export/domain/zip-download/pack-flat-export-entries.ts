import type { PackLayoutContext, PackLayoutResult } from './pack-layout-context';
import type { ExportUnit } from './resolve-export-units';
import type { ZipEntry } from '@/modules/export/adapters/zip';

import {
  resolveExportFileName,
  stripExportExtension,
  uniqueFileName,
} from '@/modules/export/utils/file-name';
import { packModelGlb } from '../model-glb';
import { packGroupUnit } from './pack-group-unit';
import { EMPTY_SESSION_WARDROBE } from './pack-layout-context';

/**
 * Flat zip layout: one file per group/single unit at archive root.
 * Shared clips are left to the orchestrator.
 */
export async function packFlatExportEntries(
  units: readonly ExportUnit[],
  context: PackLayoutContext,
): Promise<PackLayoutResult> {
  const { clips, format, modelFileNames, groupFileNames, sessionSkinsByModel }
    = context;
  const takenNames = new Set<string>();
  const entries: ZipEntry[] = [];

  for (const unit of units) {
    if (unit.kind === 'group' && unit.group) {
      const packed = await packGroupUnit(
        unit.models,
        clips,
        unit.group,
        format,
        groupFileNames[unit.group.id],
      );
      const fileName = uniqueFileName(packed.resolvedFileName, takenNames);
      takenNames.add(fileName);
      entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
      continue;
    }

    const model = unit.models[0];
    if (!model) {
      continue;
    }

    const sessionWardrobe
      = sessionSkinsByModel[model.id] ?? EMPTY_SESSION_WARDROBE;
    const packed = await packModelGlb(model, clips, { sessionWardrobe });
    const fallback = `${stripExportExtension(model.fileName)}.${format}`;
    const fileName = uniqueFileName(
      resolveExportFileName(modelFileNames[model.id], fallback, format),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
  }

  return { entries, packedSharedClipIds: new Set() };
}
