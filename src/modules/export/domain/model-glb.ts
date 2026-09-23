import type { AnimationClip } from 'three';

import type { ClipEntry } from '@/modules/animation/types/clip';
import type { SessionSkinWardrobe } from '@/modules/create/types/session-skins';
import type { ModelEntry } from '@/modules/viewport/types/model';

import { bakeTimeScale } from '@/modules/animation/domain/clip-bake';
import {
  buildSkeletonNodeSet,
  validateClipAgainstSkeleton,
} from '@/modules/animation/domain/clip-validate';
import { exportGlbBinary } from '../adapters/gltf-exporter';
import { stripGlbExtension } from '../utils/file-name';
import { attachSessionSkinsForExport } from './attach-session-skins-for-export';

export interface ModelGlbResult {
  arrayBuffer: ArrayBuffer;
  fileName: string;
}

export interface PackModelGlbOptions {
  /**
   * When false, pack mesh (+ active maps) with no embedded clips
   * (folder layout sidecars — US-49). Default true.
   */
  includeClips?: boolean;
  /**
   * When true (default), embed every session wardrobe texture in the GLB via
   * temporary helper meshes (flat zip). Folder layout passes false (PNG sidecars).
   */
  embedSessionSkins?: boolean;
  /** Wardrobe to embed when `embedSessionSkins` is true. Caller resolves from store. */
  sessionWardrobe?: SessionSkinWardrobe;
}

/** Bake time scale for every clip that packs with this model. */
function collectModelExportAnimations(
  model: ModelEntry,
  clips: readonly ClipEntry[],
): AnimationClip[] {
  return collectModelExportClips(model, clips).map((entry) =>
    bakeTimeScale(entry.clip!, entry.timeScale),
  );
}

/**
 * Library clips that pack with this model (owned ready, or validating shared
 * for imported models). Same set as embedded animations when `includeClips`.
 */
export function collectModelExportClips(
  model: ModelEntry,
  clips: readonly ClipEntry[],
): ClipEntry[] {
  if (model.source === 'created') {
    const animations: ClipEntry[] = [];
    for (const entry of clips) {
      if (
        entry.ownerModelId !== model.id
        || !entry.clip
        || entry.status !== 'ready'
      ) {
        continue;
      }
      animations.push(entry);
    }
    return animations;
  }

  const nodeNames = buildSkeletonNodeSet(model.scene);
  const animations: ClipEntry[] = [];

  for (const entry of clips) {
    if (!entry.clip) {
      continue;
    }
    // Other models' owned clips never pack into this GLB.
    if (entry.ownerModelId !== null && entry.ownerModelId !== model.id) {
      continue;
    }
    // Owned clips for this model: already validated at sync time, include if ready.
    if (entry.ownerModelId === model.id) {
      if (entry.status === 'ready') {
        animations.push(entry);
      }
      continue;
    }
    // Shared clips: validate against this model, skip conflicted.
    if (validateClipAgainstSkeleton(entry.clip, nodeNames).valid) {
      animations.push(entry);
    }
  }

  return animations;
}

/**
 * Serialize a library model scene as `{fileName}.glb`.
 * Created models pack the mesh scene plus owned ready clips (when authored).
 * Flat pack embeds the full session skin wardrobe when present (US-49).
 */
export async function packModelGlb(
  model: ModelEntry,
  clips: readonly ClipEntry[],
  options: PackModelGlbOptions = {},
): Promise<ModelGlbResult> {
  const includeClips = options.includeClips !== false;
  const embedSessionSkins = options.embedSessionSkins !== false;
  const animations = includeClips
    ? collectModelExportAnimations(model, clips)
    : [];

  const wardrobe = options.sessionWardrobe;
  const detachSkins
    = embedSessionSkins && wardrobe
      ? attachSessionSkinsForExport(model.scene, wardrobe)
      : () => {};

  try {
    const arrayBuffer = await exportGlbBinary(model.scene, animations);
    return { arrayBuffer, fileName: `${stripGlbExtension(model.fileName)}.glb` };
  } finally {
    detachSkins();
  }
}
