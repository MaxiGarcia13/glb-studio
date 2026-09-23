import type { PackLayoutContext } from './pack-layout-context';
import type { DownloadExportZipInput } from './types';
import type { ZipEntry } from '@/modules/export/adapters/zip';

import type { ExportFormat } from '@/modules/export/utils/file-name';
import { downloadBlob } from '@/modules/export/adapters/download';
import { buildZipArchive } from '@/modules/export/adapters/zip';
import {
  defaultExportZipFileName,
  resolveExportFileName,
  resolveZipFileName,
  uniqueFileName,
} from '@/modules/export/utils/file-name';
import { packClipGlb } from '../clip-glb';
import { finalizeEntries } from './finalize-entries';
import { packFlatExportEntries } from './pack-flat-export-entries';
import { packFoldersExportEntries } from './pack-folders-export-entries';
import { resolveExportUnits } from './resolve-export-units';
import { sharedAnimationOnlyClips } from './shared-clips';
import { resolveSkeletonFallback } from './skeleton-fallback';

export async function downloadExportZip(
  input: DownloadExportZipInput,
): Promise<void> {
  const options = input.options ?? {};
  const format: ExportFormat = options.format ?? 'glb';
  const layout = options.layout ?? 'flat';
  const { models, clips, groups, activeModel, sessionSkinsByModel } = input;

  const skeletonFallback = resolveSkeletonFallback(models, activeModel);
  const units = resolveExportUnits(models, groups);
  const hasSharedClips = sharedAnimationOnlyClips(clips).length > 0;

  if (units.length === 0 && !hasSharedClips) {
    throw new Error('Nothing to pack');
  }

  const layoutContext: PackLayoutContext = {
    clips,
    format,
    modelFileNames: options.modelFileNames ?? {},
    groupFileNames: options.groupFileNames ?? {},
    sessionSkinsByModel,
  };

  const packedLayout = layout === 'folders'
    ? await packFoldersExportEntries(units, layoutContext)
    : await packFlatExportEntries(units, layoutContext);

  const entries: ZipEntry[] = [...packedLayout.entries];
  const takenNames = new Set(entries.map((entry) => entry.fileName));

  for (const entry of sharedAnimationOnlyClips(clips)) {
    // Already written under a model’s animations/ folder.
    if (layout === 'folders' && packedLayout.packedSharedClipIds.has(entry.id)) {
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
