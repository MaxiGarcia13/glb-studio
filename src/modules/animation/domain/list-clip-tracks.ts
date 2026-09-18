import type { AnimationClip, KeyframeTrack } from 'three';

import { splitTrackName } from '@/modules/animation/domain/clip-validate';

export interface ClipTrackInfo {
  /** Full `KeyframeTrack.name` — stable id within a clip. */
  name: string;
  nodeName: string;
  suffix: string | null;
  valueSize: number;
  keyCount: number;
}

export function toClipTrackInfo(track: KeyframeTrack): ClipTrackInfo {
  const { nodeName, suffix } = splitTrackName(track.name);
  return {
    name: track.name,
    nodeName,
    suffix,
    valueSize: track.getValueSize(),
    keyCount: track.times.length,
  };
}

/** All tracks on a clip, in clip order. */
export function listClipTracks(clip: AnimationClip): ClipTrackInfo[] {
  return clip.tracks.map(toClipTrackInfo);
}

/**
 * Filter tracks whose parsed node matches `nodeName` (same contract as
 * `writeNodeKeyframe` / `splitTrackName`). Empty `nodeName` → no matches.
 */
export function filterClipTracksByNode(
  tracks: readonly ClipTrackInfo[],
  nodeName: string | null | undefined,
): ClipTrackInfo[] {
  if (!nodeName) {
    return [];
  }
  return tracks.filter((track) => track.nodeName === nodeName);
}

/** Short row label; `title` should keep `track.name` for paths / vendor forms. */
export function clipTrackDisplayLabel(track: ClipTrackInfo): string {
  if (track.suffix) {
    return `${track.nodeName}${track.suffix}`;
  }
  return track.name;
}
