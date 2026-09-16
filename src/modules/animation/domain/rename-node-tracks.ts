import type { AnimationClip } from 'three';
import { AnimationClip as ThreeAnimationClip } from 'three';

import { splitTrackName } from '@/modules/animation/domain/clip-validate';

/**
 * Rewrite track names that target `fromName` to `toName`, preserving every track.
 * Unlike `remapClipTracks`, unmapped nodes are kept (not dropped).
 */
export function renameNodeInClipTracks(
  clip: AnimationClip,
  fromName: string,
  toName: string,
): AnimationClip {
  if (!fromName || fromName === toName) {
    return clip;
  }

  let changed = false;
  const tracks = clip.tracks.map((track) => {
    const { nodeName, suffix } = splitTrackName(track.name);
    if (nodeName !== fromName) {
      return track;
    }
    changed = true;
    const clone = track.clone();
    clone.name = suffix ? toName + suffix : toName;
    return clone;
  });

  if (!changed) {
    return clip;
  }

  return new ThreeAnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
}
