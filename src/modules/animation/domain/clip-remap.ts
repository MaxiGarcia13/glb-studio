import type { HipsRebaseFrames } from '@/modules/animation/domain/hips-rebase';
import * as THREE from 'three';

import { splitTrackName } from '@/modules/animation/domain/clip-validate';
import {
  rebaseHipsPositionTrack,
  rebaseHipsQuaternionTrack,
} from '@/modules/animation/domain/hips-rebase';

export interface RemapResult {
  clip: THREE.AnimationClip | null;
  /** Source bone names whose tracks were omitted (left unmapped). */
  skippedBones: string[];
  error: string | null;
}

export interface RemapClipOptions {
  /** Median rest-pose length ratio for position tracks. */
  positionScale?: number;
  /**
   * Keep `.position` only for this source bone (hips); drop other
   * position tracks. Required with `hipsRebase` when the clip has positions.
   */
  hipsSourceBone?: string;
  /** Parent-bind rebase for hips position + quaternion tracks. */
  hipsRebase?: HipsRebaseFrames;
}

export function remapClipTracks(
  sourceClip: THREE.AnimationClip,
  mapping: Map<string, string>,
  options: RemapClipOptions | number = {},
): RemapResult {
  // Legacy positional `positionScale` from early call sites.
  const opts: RemapClipOptions
    = typeof options === 'number' ? { positionScale: options } : options;
  const positionScale = opts.positionScale ?? 1;
  const hipsSourceBone = opts.hipsSourceBone;
  const hipsRebase = opts.hipsRebase;

  if (mapping.size === 0) {
    return {
      clip: null,
      skippedBones: [],
      error: 'Map at least one bone before applying',
    };
  }

  const skipped = new Set<string>();
  const tracks: THREE.KeyframeTrack[] = [];

  for (const track of sourceClip.tracks) {
    const { nodeName, suffix } = splitTrackName(track.name);
    if (!nodeName) {
      tracks.push(track.clone());
      continue;
    }

    const target = mapping.get(nodeName);
    if (target === undefined) {
      skipped.add(nodeName);
      continue;
    }

    if (
      suffix === '.position'
      && hipsSourceBone !== undefined
      && nodeName !== hipsSourceBone
    ) {
      continue;
    }

    const clone = track.clone();
    if (suffix) {
      clone.name = target + suffix;
    }

    const isHips = hipsSourceBone !== undefined && nodeName === hipsSourceBone;

    if (suffix === '.position') {
      if (isHips && hipsRebase) {
        rebaseHipsPositionTrack(clone, hipsRebase, positionScale);
      } else if (positionScale !== 1) {
        const values = clone.values;
        for (let i = 0; i < values.length; i += 1) {
          values[i] *= positionScale;
        }
      }
    } else if (suffix === '.quaternion' && isHips && hipsRebase) {
      rebaseHipsQuaternionTrack(clone, hipsRebase);
    }

    tracks.push(clone);
  }

  if (tracks.length === 0) {
    return {
      clip: null,
      skippedBones: [...skipped],
      error: 'No tracks left after skipping unmapped bones',
    };
  }

  const clip = new THREE.AnimationClip(
    sourceClip.name,
    sourceClip.duration,
    tracks,
  );
  return { clip, skippedBones: [...skipped], error: null };
}
