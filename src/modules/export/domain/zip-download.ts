import type { ZipEntry } from '../adapters/zip';
import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { Group } from 'three';
import { $clips } from '@/modules/animation/stores/clip-store';
import { $activeModel, $model } from '@/modules/viewport/stores/model-store';
import { downloadBlob } from '../adapters/download';
import { buildZipArchive } from '../adapters/zip';
import {
  resolveGlbFileName,
  resolveZipFileName,
  stripGlbExtension,
} from '../utils/file-name';
import { packClipGlb } from './clip-glb';
import { MERGED_GLB_FILE_NAME, packMergedModelsGlb } from './merged-glb';
import { packModelGlb } from './model-glb';

export const EXPORT_ZIP_FILE_NAME = 'glb-export.zip';

export interface ExportZipOptions {
  /** When true, pack previewed models into one GLB (scene bake from per-model picks). */
  mergeModels?: boolean;
  /** Download name for the zip archive (`.zip` appended if missing). */
  zipFileName?: string;
  /** Basename for the merged GLB when merge is on. */
  mergedFileName?: string;
  /** Per-model id → basename override when merge is off. */
  modelFileNames?: Record<string, string>;
  /** Per previewed model id → clip id to include in the merge scene bake. */
  clipIdByModelId?: Record<string, string>;
  /** Combined multi-character clip name inside the merged GLB. */
  sceneClipName?: string;
}

function resolvePreviewedModels(
  models: readonly ModelEntry[],
  previewModelIds: readonly string[],
): ModelEntry[] {
  const byId = new Map(models.map((model) => [model.id, model]));
  return previewModelIds.flatMap((id) => {
    const model = byId.get(id);
    return model ? [model] : [];
  });
}

/** Shared clips that ship as animation-only GLBs (owned never leave their model file). */
function sharedAnimationOnlyClips(clips: readonly ClipEntry[]): ClipEntry[] {
  return clips.filter((entry) => entry.clip !== null && entry.ownerModelId === null);
}

export async function downloadExportZip(
  options: ExportZipOptions = {},
): Promise<void> {
  const mergeRequested = options.mergeModels === true;
  const modelState = $model.get();
  const clipState = $clips.get();

  const models = modelState.models;
  const workingClips = clipState.clips.filter((entry) => entry.clip !== null);

  if (models.length === 0 && workingClips.length === 0) {
    throw new Error('Nothing to pack');
  }

  const previewed = resolvePreviewedModels(models, modelState.previewModelIds);
  const mergeModels = mergeRequested && previewed.length >= 2;
  const modelFileNames = options.modelFileNames ?? {};

  const skeletonFallback
    = $activeModel.get()?.scene
      ?? previewed[0]?.scene
      ?? new Group();

  const entries: ZipEntry[] = [];

  if (mergeModels) {
    const packed = await packMergedModelsGlb(previewed, clipState.clips, {
      clipIdByModelId: options.clipIdByModelId,
      sceneClipName: options.sceneClipName,
    });
    entries.push({
      arrayBuffer: packed.arrayBuffer,
      fileName: resolveGlbFileName(options.mergedFileName, MERGED_GLB_FILE_NAME),
    });
  } else {
    for (const model of models) {
      const packed = await packModelGlb(model, clipState.clips);
      const fallback = `${stripGlbExtension(model.fileName)}.glb`;
      entries.push({
        arrayBuffer: packed.arrayBuffer,
        fileName: resolveGlbFileName(modelFileNames[model.id], fallback),
      });
    }
  }

  for (const entry of sharedAnimationOnlyClips(clipState.clips)) {
    entries.push(await packClipGlb(entry, skeletonFallback));
  }

  const blob = await buildZipArchive(entries);
  downloadBlob(blob, resolveZipFileName(options.zipFileName, EXPORT_ZIP_FILE_NAME));
}
