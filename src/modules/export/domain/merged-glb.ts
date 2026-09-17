import type { Group } from 'three';
import type { ModelNamespace } from './merge-namespace';
import type { ModelGroupManifest } from './model-group-manifest';
import type { ClipEntry } from '@/modules/animation/types/clip';

import type { ModelEntry } from '@/modules/viewport/types/model';
import { Group as ThreeGroup } from 'three';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { exportGlbBinary } from '../adapters/gltf-exporter';
import {
  buildMergeExportClips,
  buildUniqueModelPrefix,
  clipRecordsForMember,
  createModelNamespace,
} from './merge-namespace';
import {
  MODEL_GROUP_MANIFEST_KEY,
  MODEL_GROUP_MANIFEST_VERSION,
  MODEL_GROUP_MEMBER_KEY,
} from './model-group-manifest';

export interface MergedGlbResult {
  arrayBuffer: ArrayBuffer;
  fileName: string;
}

export interface PackMergedModelsOptions {
  /** Root group name in the packed GLB (default `merged`). */
  rootName?: string;
}

export const MERGED_GLB_FILE_NAME = 'merged.glb';

/**
 * Pack models into one GLB with unique bone prefixes.
 * Embeds each member’s owned ready clips (remapped); shared clips stay sidecars.
 * Stamps an editor manifest so import can restore group → models → clips.
 */
export async function packMergedModelsGlb(
  models: readonly ModelEntry[],
  clips: readonly ClipEntry[],
  options: PackMergedModelsOptions = {},
): Promise<MergedGlbResult> {
  if (models.length === 0) {
    throw new Error('Nothing to merge');
  }

  const rootName = options.rootName?.trim() || 'merged';
  const root = new ThreeGroup();
  root.name = rootName;

  const prefixTaken = new Set<string>();
  const namespaces: ModelNamespace[] = [];

  for (const model of models) {
    const clone = SkeletonUtils.clone(model.scene) as Group;
    clone.name = clone.name || model.fileName;
    const prefix = buildUniqueModelPrefix(model, prefixTaken);
    const ns = createModelNamespace(model, clone, prefix);
    namespaces.push(ns);
    clone.userData[MODEL_GROUP_MEMBER_KEY] = {
      prefix,
      fileName: model.fileName,
      source: model.source,
    };
    root.add(clone);
  }

  const clipRecords = buildMergeExportClips(namespaces, clips);
  const manifest: ModelGroupManifest = {
    version: MODEL_GROUP_MANIFEST_VERSION,
    name: rootName,
    members: namespaces.map((ns) => ({
      fileName: ns.fileName,
      prefix: ns.prefix,
      source: ns.source,
      clips: clipRecordsForMember(clipRecords, ns.modelId),
    })),
  };
  root.userData[MODEL_GROUP_MANIFEST_KEY] = manifest;

  const animations = clipRecords.map((record) => record.clip);
  const arrayBuffer = await exportGlbBinary(root, animations);
  return { arrayBuffer, fileName: MERGED_GLB_FILE_NAME };
}
