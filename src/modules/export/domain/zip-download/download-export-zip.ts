import type { DownloadExportZipInput } from './types';
import type { ZipEntry } from '@/modules/export/adapters/zip';

import type { ExportFormat } from '@/modules/export/utils/file-name';
import { downloadBlob } from '@/modules/export/adapters/download';
import { buildZipArchive } from '@/modules/export/adapters/zip';
import {
  defaultExportZipFileName,
  resolveExportFileName,
  resolveZipFileName,
  stripExportExtension,
  uniqueFileName,
} from '@/modules/export/utils/file-name';
import { packClipGlb } from '../clip-glb';
import { packMergedModelsGlb } from '../merged-glb';
import { packModelGlb } from '../model-glb';
import { finalizeEntries } from './finalize-entries';
import { packFolderModelEntries } from './pack-folder-model-entries';
import { resolveExportUnits } from './resolve-export-units';
import { sharedAnimationOnlyClips } from './shared-clips';
import { resolveSkeletonFallback } from './skeleton-fallback';
import { joinZipPath, uniquePathSegment } from './zip-path';

const EMPTY_WARDROBE = { skins: [], activeSkinId: null } as const;

export async function downloadExportZip(
  input: DownloadExportZipInput,
): Promise<void> {
  const options = input.options ?? {};
  const format: ExportFormat = options.format ?? 'glb';
  const layout = options.layout ?? 'flat';
  const { models, clips, groups, activeModel, sessionSkinsByModel } = input;

  const modelFileNames = options.modelFileNames ?? {};
  const groupFileNames = options.groupFileNames ?? {};
  const skeletonFallback = resolveSkeletonFallback(models, activeModel);
  const units = resolveExportUnits(models, groups);
  const hasSharedClips = sharedAnimationOnlyClips(clips).length > 0;

  if (units.length === 0 && !hasSharedClips) {
    throw new Error('Nothing to pack');
  }

  const takenNames = new Set<string>();
  const takenFolderBases = new Set<string>();
  const entries: ZipEntry[] = [];
  const packedSharedClipIds = new Set<string>();

  for (const unit of units) {
    if (unit.kind === 'group' && unit.group) {
      const packed = await packMergedModelsGlb(unit.models, clips, {
        rootName: unit.group.name,
      });
      const fallback = `${unit.group.name}.${format}`;
      const resolved = resolveExportFileName(
        groupFileNames[unit.group.id],
        fallback,
        format,
      );

      let fileName: string;
      if (layout === 'folders') {
        const folderBase = uniquePathSegment(
          stripExportExtension(resolved),
          takenFolderBases,
        );
        fileName = uniqueFileName(
          joinZipPath(folderBase, resolveExportFileName(undefined, `${folderBase}.${format}`, format)),
          takenNames,
        );
      } else {
        fileName = uniqueFileName(resolved, takenNames);
      }

      takenNames.add(fileName);
      entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
      continue;
    }

    const model = unit.models[0];
    if (!model) {
      continue;
    }

    const sessionWardrobe
      = sessionSkinsByModel[model.id] ?? EMPTY_WARDROBE;

    if (layout === 'folders') {
      const folderPack = await packFolderModelEntries({
        model,
        clips,
        format,
        modelFileName: modelFileNames[model.id],
        takenNames,
        takenFolderBases,
        sessionWardrobe,
      });
      entries.push(...folderPack.entries);
      for (const id of folderPack.packedSharedClipIds) {
        packedSharedClipIds.add(id);
      }
      continue;
    }

    const packed = await packModelGlb(model, clips, { sessionWardrobe });
    const fallback = `${stripExportExtension(model.fileName)}.${format}`;
    const fileName = uniqueFileName(
      resolveExportFileName(modelFileNames[model.id], fallback, format),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
  }

  for (const entry of sharedAnimationOnlyClips(clips)) {
    // Already written under a model’s animations/ folder.
    if (layout === 'folders' && packedSharedClipIds.has(entry.id)) {
      continue;
    }

    const packed = await packClipGlb(entry, skeletonFallback);
    const fileName = uniqueFileName(
      resolveExportFileName(undefined, packed.fileName, format),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
  }

  if (entries.length === 0) {
    throw new Error('Nothing to pack');
  }

  // Convert-each before zip; any failure aborts (no partial download).
  const finalEntries = await finalizeEntries(entries, format);

  const blob = await buildZipArchive(finalEntries);
  downloadBlob(
    blob,
    resolveZipFileName(
      options.zipFileName,
      defaultExportZipFileName(format),
      format,
    ),
  );
}
