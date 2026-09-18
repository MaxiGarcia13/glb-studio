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

export interface TrackKeyframe {
  /** Index in the track’s current times/values arrays. */
  index: number;
  time: number;
  values: number[];
}

/** Keys on one track, in track order. */
export function listTrackKeyframes(track: KeyframeTrack): TrackKeyframe[] {
  const valueSize = track.getValueSize();
  const keys: TrackKeyframe[] = [];
  for (let index = 0; index < track.times.length; index++) {
    keys.push({
      index,
      time: track.times[index],
      values: Array.from(
        track.values.subarray(index * valueSize, (index + 1) * valueSize),
      ),
    });
  }
  return keys;
}

export function findTrackByName(
  clip: AnimationClip,
  trackName: string,
): KeyframeTrack | undefined {
  return clip.tracks.find((track) => track.name === trackName);
}

const CHANNEL_XYZ = ['X', 'Y', 'Z'] as const;
const CHANNEL_XYZW = ['X', 'Y', 'Z', 'W'] as const;

/** Column headers for a track’s value components (XYZ / XYZW when known). */
export function trackValueChannelLabels(
  trackName: string,
  valueSize: number,
): string[] {
  const { suffix } = splitTrackName(trackName);
  if (suffix === '.quaternion' && valueSize === 4) {
    return [...CHANNEL_XYZW];
  }
  if ((suffix === '.position' || suffix === '.scale') && valueSize === 3) {
    return [...CHANNEL_XYZ];
  }
  return Array.from({ length: valueSize }, (_, channel) => `v${channel}`);
}
