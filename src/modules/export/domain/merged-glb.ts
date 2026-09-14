import type { Group } from 'three';
import type { ModelNamespace } from './merge-namespace';
import type { ClipEntry } from '@/modules/animation/types/clip';

import type { ModelEntry } from '@/modules/viewport/types/model';
import { Group as ThreeGroup } from 'three';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { exportGlbBinary } from '../adapters/gltf-exporter';
import {
  buildMergeExportClips,
  buildUniqueModelPrefix,
  createModelNamespace,
  DEFAULT_SCENE_CLIP_NAME,

} from './merge-namespace';

export interface MergedGlbResult {
  arrayBuffer: ArrayBuffer;
  fileName: string;
}

export interface PackMergedModelsOptions {
  /** Per previewed model id → library clip id to bake (omit / empty = bind pose only). */
  clipIdByModelId?: Readonly<Record<string, string>>;
  /** Name of the combined multi-character clip (default `Scene`). */
  sceneClipName?: string;
}

export const MERGED_GLB_FILE_NAME = 'merged.glb';

/**
 * Pack previewed models into one GLB with unique bone prefixes.
 * Bakes a single Scene clip from per-model picks (e.g. fight take).
 */
export async function packMergedModelsGlb(
  models: readonly ModelEntry[],
  clips: readonly ClipEntry[],
  options: PackMergedModelsOptions = {},
): Promise<MergedGlbResult> {
  if (models.length === 0) {
    throw new Error('Nothing to merge');
  }

  const root = new ThreeGroup();
  root.name = 'merged';

  const prefixTaken = new Set<string>();
  const namespaces: ModelNamespace[] = [];

  for (const model of models) {
    const clone = SkeletonUtils.clone(model.scene) as Group;
    clone.name = clone.name || model.fileName;
    const prefix = buildUniqueModelPrefix(model, prefixTaken);
    namespaces.push(createModelNamespace(model, clone, prefix));
    root.add(clone);
  }

  const animations = buildMergeExportClips(
    namespaces,
    clips,
    options.clipIdByModelId ?? {},
    options.sceneClipName ?? DEFAULT_SCENE_CLIP_NAME,
  );
  const arrayBuffer = await exportGlbBinary(root, animations);
  return { arrayBuffer, fileName: MERGED_GLB_FILE_NAME };
}
