import type { ZipEntry } from '../adapters/zip';
import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

import { Group } from 'three';
import { $clips } from '@/modules/animation/stores/clip-store';
import { $modelGroups } from '@/modules/viewport/stores/model-group-store';
import { $activeModel, $model } from '@/modules/viewport/stores/model-store';
import { downloadBlob } from '../adapters/download';
import { buildZipArchive } from '../adapters/zip';
import {
  EXPORT_ZIP_FILE_NAME,
  resolveGlbFileName,
  resolveZipFileName,
  stripGlbExtension,
  uniqueFileName,
} from '../utils/file-name';
import { packClipGlb } from './clip-glb';
import { isExportableModel } from './exportable-model';
import { packMergedModelsGlb } from './merged-glb';
import { packModelGlb } from './model-glb';

export interface ExportZipOptions {
  /** Download name for the zip archive (`.zip` appended if missing). */
  zipFileName?: string;
  /** Per model-group id → basename for that group's packed GLB. */
  groupFileNames?: Record<string, string>;
  /** Per model id → basename when the model is not in a multi-model group. */
  modelFileNames?: Record<string, string>;
}

interface ExportUnit {
  kind: 'group' | 'single';
  group: ModelGroup | null;
  models: ModelEntry[];
}

/**
 * Each editor model group with ≥2 exportable members → one merged unit;
 * leftover / ungrouped exportable models → one unit each.
 * Created models with no stamped mesh parts are omitted.
 */
export function resolveExportUnits(
  models: readonly ModelEntry[],
  groups: readonly ModelGroup[],
): ExportUnit[] {
  const exportable = models.filter(isExportableModel);
  const byId = new Map(exportable.map((model) => [model.id, model]));
  const units: ExportUnit[] = [];
  const consumed = new Set<string>();

  for (const group of groups) {
    const members = group.modelIds.flatMap((id) => {
      const model = byId.get(id);
      return model ? [model] : [];
    });
    if (members.length === 0) {
      continue;
    }
    for (const member of members) {
      consumed.add(member.id);
    }
    if (members.length >= 2) {
      units.push({ kind: 'group', group, models: members });
    } else {
      units.push({ kind: 'single', group: null, models: members });
    }
  }

  for (const model of exportable) {
    if (!consumed.has(model.id)) {
      units.push({ kind: 'single', group: null, models: [model] });
    }
  }

  return units;
}

/** Shared clips that ship as animation-only GLBs (owned never leave their model file). */
function sharedAnimationOnlyClips(clips: readonly ClipEntry[]): ClipEntry[] {
  return clips.filter((entry) => entry.clip !== null && entry.ownerModelId === null);
}

/** Prefer an imported rig; created scenes have no skeleton for animation-only GLBs. */
function resolveSkeletonFallback(
  models: readonly ModelEntry[],
  active: ModelEntry | null,
): Group {
  const preferred
    = (active?.source === 'imported' ? active : null)
      ?? models.find((model) => model.source === 'imported')
      ?? active
      ?? models[0]
      ?? null;

  return preferred?.scene ?? new Group();
}

export async function downloadExportZip(
  options: ExportZipOptions = {},
): Promise<void> {
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
  const entries: ZipEntry[] = [];

  for (const unit of units) {
    if (unit.kind === 'group' && unit.group) {
      const packed = await packMergedModelsGlb(unit.models, clipState.clips, {
        rootName: unit.group.name,
      });
      const fallback = `${unit.group.name}.glb`;
      const fileName = uniqueFileName(
        resolveGlbFileName(groupFileNames[unit.group.id], fallback),
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
    const packed = await packModelGlb(model, clipState.clips);
    const fallback = `${stripGlbExtension(model.fileName)}.glb`;
    const fileName = uniqueFileName(
      resolveGlbFileName(modelFileNames[model.id], fallback),
      takenNames,
    );
    takenNames.add(fileName);
    entries.push({ arrayBuffer: packed.arrayBuffer, fileName });
  }

  for (const entry of sharedAnimationOnlyClips(clipState.clips)) {
    entries.push(await packClipGlb(entry, skeletonFallback));
  }

  if (entries.length === 0) {
    throw new Error('Nothing to pack');
  }

  const blob = await buildZipArchive(entries);
  downloadBlob(blob, resolveZipFileName(options.zipFileName, EXPORT_ZIP_FILE_NAME));
}
