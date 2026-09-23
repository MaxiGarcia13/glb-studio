import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ZipEntry } from '@/modules/export/adapters/zip';
import type { ExportFormat } from '@/modules/export/utils/file-name';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { getSessionSkinWardrobe } from '@/modules/create/stores/session-skins-store';
import { pngArrayBufferFromTexture } from '@/modules/export/adapters/png-from-texture';
import {
  resolveExportFileName,
  stripExportExtension,
  uniqueFileName,
} from '@/modules/export/utils/file-name';
import { packClipGlb } from '../clip-glb';
import { collectModelExportClips, packModelGlb } from '../model-glb';
import { joinZipPath, uniquePathSegment } from './zip-path';

export interface PackFolderModelResult {
  entries: ZipEntry[];
  /** Shared clip ids written under this model’s `animations/` folder. */
  packedSharedClipIds: string[];
}

/**
 * Pack one ungrouped model as
 * `{Base}/{Base}.{ext}`, `{Base}/animations/*`, `{Base}/skins/*.png`.
 */
export async function packFolderModelEntries(options: {
  model: ModelEntry;
  clips: readonly ClipEntry[];
  format: ExportFormat;
  modelFileName?: string;
  takenNames: Set<string>;
  takenFolderBases: Set<string>;
}): Promise<PackFolderModelResult> {
  const {
    model,
    clips,
    format,
    modelFileName,
    takenNames,
    takenFolderBases,
  } = options;

  const fallbackBase = stripExportExtension(model.fileName) || 'model';
  const preferredBase = stripExportExtension(
    modelFileName ?? model.fileName,
  ) || fallbackBase;
  const folderBase = uniquePathSegment(preferredBase, takenFolderBases);

  const packedModel = await packModelGlb(model, clips, {
    includeClips: false,
    embedSessionSkins: false,
  });
  const modelEntryName = uniqueFileName(
    joinZipPath(folderBase, resolveExportFileName(undefined, `${folderBase}.${format}`, format)),
    takenNames,
  );
  takenNames.add(modelEntryName);

  const entries: ZipEntry[] = [
    { arrayBuffer: packedModel.arrayBuffer, fileName: modelEntryName },
  ];

  const exportClips = collectModelExportClips(model, clips);
  const packedSharedClipIds: string[] = [];

  for (const entry of exportClips) {
    const packed = await packClipGlb(entry, model.scene);
    const clipBase = stripExportExtension(packed.fileName) || entry.name;
    const fileName = uniqueFileName(
      joinZipPath(
        folderBase,
        'animations',
        resolveExportFileName(undefined, `${clipBase}.${format}`, format),
      ),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
    if (entry.ownerModelId === null) {
      packedSharedClipIds.push(entry.id);
    }
  }

  const wardrobe = getSessionSkinWardrobe(model.id);
  for (const skin of wardrobe.skins) {
    const arrayBuffer = await pngArrayBufferFromTexture(skin.texture);
    const skinBase = stripExportExtension(skin.label) || 'skin';
    const fileName = uniqueFileName(
      joinZipPath(folderBase, 'skins', `${skinBase}.png`),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer, fileName });
  }

  return { entries, packedSharedClipIds };
}
