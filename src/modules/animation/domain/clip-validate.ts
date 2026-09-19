import type { AnimationClip, Object3D } from 'three';

export interface ClipValidationResult {
  valid: boolean;
  error: string | null;
}

const TRACK_SUFFIXES = [
  '.position',
  '.quaternion',
  '.scale',
  '.morphTargetInfluences',
];

export function splitTrackName(trackName: string): { nodeName: string; suffix: string | null } {
  for (const suffix of TRACK_SUFFIXES) {
    if (trackName.endsWith(suffix)) {
      return { nodeName: trackName.slice(0, -suffix.length), suffix };
    }
  }
  return { nodeName: trackName, suffix: null };
}

/** Node names referenced by TRS / morph tracks on the given clips. */
export function collectClipTargetNodeNames(
  clips: readonly AnimationClip[],
): Set<string> {
  const names = new Set<string>();
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const { nodeName, suffix } = splitTrackName(track.name);
      if (suffix && nodeName) {
        names.add(nodeName);
      }
    }
  }
  return names;
}

export function buildSkeletonNodeSet(scene: Object3D): Set<string> {
  const names = new Set<string>();
  scene.traverse((object) => {
    names.add(object.name);
    names.add(object.uuid);
  });
  return names;
}

export function validateClipAgainstSkeleton(
  clip: AnimationClip,
  nodeNames: Set<string>,
): ClipValidationResult {
  const missing: string[] = [];

  for (const track of clip.tracks) {
    const { nodeName, suffix } = splitTrackName(track.name);
    if (!suffix || !nodeName) {
      missing.push(track.name);
      continue;
    }
    if (!nodeNames.has(nodeName)) {
      missing.push(nodeName);
    }
  }

  if (missing.length > 0) {
    const count = new Set(missing).size;
    return {
      valid: false,
      error:
        count === 1
          ? '1 track doesn\'t match this model'
          : `${count} tracks don't match this model`,
    };
  }

  return { valid: true, error: null };
}
