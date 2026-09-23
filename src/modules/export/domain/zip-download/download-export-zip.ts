import type { ExportZipOptions } from './types';
import type { ZipEntry } from '@/modules/export/adapters/zip';

import type { ExportFormat } from '@/modules/export/utils/file-name';
import { $clips } from '@/modules/animation/stores/clip-store';
import { downloadBlob } from '@/modules/export/adapters/download';
import { buildZipArchive } from '@/modules/export/adapters/zip';
import {
  defaultExportZipFileName,
  resolveExportFileName,
  resolveZipFileName,
  stripExportExtension,
  uniqueFileName,
} from '@/modules/export/utils/file-name';
import { $modelGroups } from '@/modules/viewport/stores/model-group-store';
import { $activeModel, $model } from '@/modules/viewport/stores/model-store';
import { packClipGlb } from '../clip-glb';
import { packMergedModelsGlb } from '../merged-glb';
import { packModelGlb } from '../model-glb';
import { finalizeEntries } from './finalize-entries';
import { packFolderModelEntries } from './pack-folder-model-entries';
import { resolveExportUnits } from './resolve-export-units';
import { sharedAnimationOnlyClips } from './shared-clips';
import { resolveSkeletonFallback } from './skeleton-fallback';
import { joinZipPath, uniquePathSegment } from './zip-path';

export async function downloadExportZip(
  options: ExportZipOptions = {},
): Promise<void> {
  const format: ExportFormat = options.format ?? 'glb';
  const layout = options.layout ?? 'flat';
  const modelState = $model.get();
  const clipState = $clips.get();
  const groups = $modelGroups.get().groups;

  const models = modelState.models;

  const modelFileNames = options.modelFileNames ?? {};
  const groupFileNames = options.groupFileNames ?? {};
  const skeletonFallback = resolveSkeletonFallback(models, $activeModel.get());
  const units = resolveExportUnits(models, groups);
  const hasSharedClips = sharedAnimationOnlyClips(clipState.clips).length > 0;

  if (units.length === 0 && !hasSharedClips) {
    throw new Error('Nothing to pack');
  }

  const takenNames = new Set<string>();
  const takenFolderBases = new Set<string>();
  const entries: ZipEntry[] = [];
  const packedSharedClipIds = new Set<string>();

  for (const unit of units) {
    if (unit.kind === 'group' && unit.group) {
      const packed = await packMergedModelsGlb(unit.models, clipState.clips, {
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

    if (layout === 'folders') {
      const folderPack = await packFolderModelEntries({
        model,
        clips: clipState.clips,
        format,
        modelFileName: modelFileNames[model.id],
        takenNames,
        takenFolderBases,
      });
      entries.push(...folderPack.entries);
      for (const id of folderPack.packedSharedClipIds) {
        packedSharedClipIds.add(id);
      }
      continue;
    }

    const packed = await packModelGlb(model, clipState.clips);
    const fallback = `${stripExportExtension(model.fileName)}.${format}`;
    const fileName = uniqueFileName(
      resolveExportFileName(modelFileNames[model.id], fallback, format),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
  }

  for (const entry of sharedAnimationOnlyClips(clipState.clips)) {
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
