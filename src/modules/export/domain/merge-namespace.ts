import type { AnimationClip, Object3D } from 'three';
import type { ModelGroupClipRecord } from './model-group-manifest';
import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { bakeTimeScale } from '@/modules/animation/domain/clip-bake';
import { remapClipTracks } from '@/modules/animation/domain/clip-remap';
import { sanitizeBaseName, stripGlbExtension } from '../utils/file-name';

export interface ModelNamespace {
  modelId: string;
  fileName: string;
  source: ModelEntry['source'];
  /** Prefix including trailing `_` (e.g. `Hero_`). */
  prefix: string;
  /** Original node name → prefixed name on the cloned graph. */
  nameMap: Map<string, string>;
}

export interface MergeExportClipRecord {
  modelId: string;
  prefix: string;
  /** Library display name. */
  name: string;
  /** Unique name written into the GLB. */
  exportName: string;
  clip: AnimationClip;
}

/** Unique prefix like `Hero_` / `Hero_2_` for bone namespacing. */
export function buildUniqueModelPrefix(
  model: ModelEntry,
  taken: Set<string>,
): string {
  const raw = sanitizeBaseName(stripGlbExtension(model.fileName)) ?? 'model';
  const slug = raw.replace(/\s+/g, '_');
  let candidate = slug;
  let index = 2;
  while (taken.has(candidate)) {
    candidate = `${slug}_${index}`;
    index++;
  }
  taken.add(candidate);
  return `${candidate}_`;
}

/**
 * Prefix every named node under `root` so bone names are unique across merged
 * characters. Returns original → prefixed map for clip track rewrite.
 */
export function namespaceSceneGraph(
  root: Object3D,
  prefix: string,
): Map<string, string> {
  const nameMap = new Map<string, string>();
  root.traverse((object) => {
    if (!object.name) {
      return;
    }
    const next = `${prefix}${object.name}`;
    nameMap.set(object.name, next);
    object.name = next;
  });
  return nameMap;
}

function uniqueClipName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  let index = 2;
  let candidate = `${name}-${index}`;
  while (taken.has(candidate)) {
    index++;
    candidate = `${name}-${index}`;
  }
  taken.add(candidate);
  return candidate;
}

function rewriteClipForNamespace(
  entry: ClipEntry,
  nameMap: Map<string, string>,
): AnimationClip | null {
  if (!entry.clip) {
    return null;
  }
  const baked = bakeTimeScale(entry.clip, entry.timeScale);
  const remapped = remapClipTracks(baked, nameMap);
  return remapped.clip;
}

/**
 * Pack every owned ready clip for each merged model (tracks remapped to that
 * model’s bone prefix). Shared clips are not included — they ship as sidecars.
 */
export function buildMergeExportClips(
  namespaces: readonly ModelNamespace[],
  clips: readonly ClipEntry[],
): MergeExportClipRecord[] {
  const takenNames = new Set<string>();
  const records: MergeExportClipRecord[] = [];

  for (const ns of namespaces) {
    for (const entry of clips) {
      if (entry.ownerModelId !== ns.modelId || !entry.clip || entry.status !== 'ready') {
        continue;
      }
      const rewritten = rewriteClipForNamespace(entry, ns.nameMap);
      if (!rewritten) {
        continue;
      }
      const exportName = uniqueClipName(entry.name, takenNames);
      rewritten.name = exportName;
      records.push({
        modelId: ns.modelId,
        prefix: ns.prefix,
        name: entry.name,
        exportName,
        clip: rewritten,
      });
    }
  }

  return records;
}

export function clipRecordsForMember(
  records: readonly MergeExportClipRecord[],
  modelId: string,
): ModelGroupClipRecord[] {
  return records
    .filter((record) => record.modelId === modelId)
    .map((record) => ({
      exportName: record.exportName,
      name: record.name,
    }));
}

export function createModelNamespace(
  model: ModelEntry,
  clonedScene: Object3D,
  prefix: string,
): ModelNamespace {
  const nameMap = namespaceSceneGraph(clonedScene, prefix);
  return {
    modelId: model.id,
    fileName: model.fileName,
    source: model.source,
    prefix,
    nameMap,
  };
}
