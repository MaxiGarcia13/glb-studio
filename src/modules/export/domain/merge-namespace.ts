import type { Object3D } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { AnimationClip } from 'three';

import { bakeTimeScale } from '@/modules/animation/domain/clip-bake';
import { remapClipTracks } from '@/modules/animation/domain/clip-remap';
import {
  buildSkeletonNodeSet,
  validateClipAgainstSkeleton,
} from '@/modules/animation/domain/clip-validate';
import { sanitizeBaseName, stripGlbExtension } from '../utils/file-name';

export interface ModelNamespace {
  modelId: string;
  /** Prefix including trailing `_` (e.g. `Hero_`). */
  prefix: string;
  /** Original node name → prefixed name on the cloned graph. */
  nameMap: Map<string, string>;
  /** Original skeleton/node names (pre-prefix) for clip validation. */
  nodeSet: Set<string>;
}

export const DEFAULT_SCENE_CLIP_NAME = 'Scene';

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

/** Owned ready for this model + shared clips that validate against its skeleton. */
export function listMergeClipChoices(
  model: ModelEntry,
  clips: readonly ClipEntry[],
): ClipEntry[] {
  const nodeSet = buildSkeletonNodeSet(model.scene);
  return clips.filter((entry) => {
    if (!entry.clip) {
      return false;
    }
    if (entry.ownerModelId === model.id) {
      return entry.status === 'ready';
    }
    if (entry.ownerModelId !== null) {
      return false;
    }
    return validateClipAgainstSkeleton(entry.clip, nodeSet).valid;
  });
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
 * Build merge animations from per-model picks:
 * one **Scene** clip = all chosen clips’ tracks (fight / multi-character take).
 */
export function buildMergeExportClips(
  namespaces: readonly ModelNamespace[],
  clips: readonly ClipEntry[],
  clipIdByModelId: Readonly<Record<string, string>>,
  sceneClipName: string = DEFAULT_SCENE_CLIP_NAME,
): AnimationClip[] {
  const clipsById = new Map(clips.map((entry) => [entry.id, entry]));
  const takenNames = new Set<string>();

  const sceneTracks: AnimationClip['tracks'] = [];
  let sceneDuration = 0;

  for (const ns of namespaces) {
    const clipId = clipIdByModelId[ns.modelId];
    if (!clipId) {
      continue;
    }
    const entry = clipsById.get(clipId);
    if (!entry) {
      continue;
    }
    const rewritten = rewriteClipForNamespace(entry, ns.nameMap);
    if (!rewritten) {
      continue;
    }

    sceneTracks.push(...rewritten.tracks);
    sceneDuration = Math.max(sceneDuration, rewritten.duration);
  }

  if (sceneTracks.length === 0) {
    return [];
  }

  const base = sanitizeBaseName(sceneClipName) ?? DEFAULT_SCENE_CLIP_NAME;
  return [
    new AnimationClip(uniqueClipName(base, takenNames), sceneDuration, sceneTracks),
  ];
}

export function createModelNamespace(
  model: ModelEntry,
  clonedScene: Object3D,
  prefix: string,
): ModelNamespace {
  const nodeSet = buildSkeletonNodeSet(model.scene);
  const nameMap = namespaceSceneGraph(clonedScene, prefix);
  return { modelId: model.id, prefix, nameMap, nodeSet };
}
