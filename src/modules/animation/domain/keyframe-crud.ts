import type { AnimationClip, KeyframeTrack } from 'three';

import { appendSample } from '@/modules/animation/domain/keyframe-sample';

export interface UpdateTrackKeyframePatch {
  time?: number;
  values?: ArrayLike<number>;
}

export interface UpdateTrackKeyframeResult {
  clip: AnimationClip;
  /** Index after rewrite (time sort / collision replace). */
  keyIndex: number;
}

/**
 * Edit one key on a track by index. Clones the clip. Changing `time` re-sorts
 * keys and replaces any other key at the same time. Values must match
 * `valueSize`. Returns `null` when the track/index/patch is invalid.
 */
export function updateTrackKeyframe(
  clip: AnimationClip,
  trackName: string,
  keyIndex: number,
  patch: UpdateTrackKeyframePatch,
): UpdateTrackKeyframeResult | null {
  if (patch.time === undefined && patch.values === undefined) {
    return null;
  }

  const working = clip.clone();
  const track = working.tracks.find((entry) => entry.name === trackName);
  if (!track) {
    return null;
  }

  const valueSize = track.getValueSize();
  const keyCount = track.times.length;
  if (keyIndex < 0 || keyIndex >= keyCount) {
    return null;
  }

  const nextTime = Math.fround(
    patch.time !== undefined
      ? Math.min(Math.max(patch.time, 0), clip.duration)
      : track.times[keyIndex],
  );

  const nextValues
    = patch.values !== undefined
      ? Array.from(patch.values)
      : Array.from(
          track.values.subarray(keyIndex * valueSize, (keyIndex + 1) * valueSize),
        );

  if (nextValues.length !== valueSize) {
    return null;
  }

  const pairs: { time: number; values: number[] }[] = [];
  for (let index = 0; index < keyCount; index++) {
    if (index === keyIndex) {
      continue;
    }
    const time = Math.fround(track.times[index]);
    if (time === nextTime) {
      continue;
    }
    pairs.push({
      time,
      values: Array.from(
        track.values.subarray(index * valueSize, (index + 1) * valueSize),
      ),
    });
  }
  pairs.push({ time: nextTime, values: nextValues });
  pairs.sort((a, b) => a.time - b.time);

  const nextTimes: number[] = [];
  const nextValueFlat: number[] = [];
  let resultIndex = 0;
  for (let index = 0; index < pairs.length; index++) {
    const pair = pairs[index];
    if (pair.time === nextTime) {
      resultIndex = index;
    }
    appendSample(nextTimes, nextValueFlat, pair.time, pair.values);
  }

  track.times = new Float32Array(nextTimes);
  track.values = new Float32Array(nextValueFlat);
  working.duration = clip.duration;
  return { clip: working, keyIndex: resultIndex };
}

export interface DeleteTrackKeyframeResult {
  clip: AnimationClip;
  /** Neighbor index after delete. */
  keyIndex: number;
}

/**
 * Remove one key by index. Clones the clip. Refuses to remove the last key
 * (Three.js cannot construct/clone empty tracks). Returns `null` when the
 * track/index is invalid or only one key remains.
 */
export function deleteTrackKeyframe(
  clip: AnimationClip,
  trackName: string,
  keyIndex: number,
): DeleteTrackKeyframeResult | null {
  const working = clip.clone();
  const track = working.tracks.find((entry) => entry.name === trackName);
  if (!track) {
    return null;
  }

  const valueSize = track.getValueSize();
  const keyCount = track.times.length;
  if (keyCount <= 1 || keyIndex < 0 || keyIndex >= keyCount) {
    return null;
  }

  const nextTimes: number[] = [];
  const nextValues: number[] = [];
  for (let index = 0; index < keyCount; index++) {
    if (index === keyIndex) {
      continue;
    }
    appendSample(
      nextTimes,
      nextValues,
      track.times[index],
      track.values.subarray(index * valueSize, (index + 1) * valueSize),
    );
  }

  track.times = new Float32Array(nextTimes);
  track.values = new Float32Array(nextValues);
  working.duration = clip.duration;

  return {
    clip: working,
    keyIndex: Math.min(keyIndex, nextTimes.length - 1),
  };
}

interface TrackInterpolant { evaluate: (time: number) => Float32Array }

/** Sample a track at `time` via its current interpolant (same as blend-bake). */
function sampleTrackAt(track: KeyframeTrack, time: number): number[] {
  const trackWithFactory = track as unknown as {
    createInterpolant: () => TrackInterpolant;
  };
  return Array.from(trackWithFactory.createInterpolant().evaluate(time));
}

/** ~1 frame at 60fps — small enough to feel “at playhead”, large enough in Float32. */
const KEY_TIME_STEP = Math.fround(1 / 60);

function occupiedKeyTimes(times: ArrayLike<number>): Set<number> {
  const occupied = new Set<number>();
  for (let index = 0; index < times.length; index++) {
    occupied.add(Math.fround(times[index]));
  }
  return occupied;
}

/**
 * Clamp `preferred` to `[0, duration]`. When `onCollision` is `nudge` and that
 * time is taken, walk forward then backward by {@link KEY_TIME_STEP} until free.
 * Returns `null` when no free slot exists (dense track / zero duration).
 */
function resolveInsertKeyTime(
  times: ArrayLike<number>,
  preferred: number,
  duration: number,
  onCollision: 'replace' | 'nudge',
): number | null {
  if (!Number.isFinite(duration) || duration < 0) {
    return null;
  }

  const clamped = Math.fround(Math.min(Math.max(preferred, 0), duration));
  if (onCollision === 'replace') {
    return clamped;
  }

  const occupied = occupiedKeyTimes(times);
  if (!occupied.has(clamped)) {
    return clamped;
  }

  for (let step = 1; ; step++) {
    const delta = Math.fround(KEY_TIME_STEP * step);
    if (delta > duration && step > times.length + 2) {
      break;
    }
    const forward = Math.fround(clamped + delta);
    if (forward <= duration && !occupied.has(forward)) {
      return forward;
    }
    const backward = Math.fround(clamped - delta);
    if (backward >= 0 && !occupied.has(backward)) {
      return backward;
    }
    if (forward > duration && backward < 0) {
      break;
    }
  }

  return null;
}

export interface InsertTrackKeyframeOptions {
  /**
   * `replace` (default) upserts when `time` matches an existing key.
   * `nudge` keeps all existing keys and picks the nearest free time.
   */
  onCollision?: 'replace' | 'nudge';
}

/**
 * Insert a key at `time`. Clones the clip. When `values` is omitted, samples
 * the track’s interpolant at the resolved time. Default collision replaces;
 * pass `onCollision: 'nudge'` for Add-at-playhead so a landing on an existing
 * key still creates a new row.
 */
export function insertTrackKeyframe(
  clip: AnimationClip,
  trackName: string,
  time: number,
  values?: ArrayLike<number>,
  options?: InsertTrackKeyframeOptions,
): UpdateTrackKeyframeResult | null {
  const working = clip.clone();
  const track = working.tracks.find((entry) => entry.name === trackName);
  if (!track) {
    return null;
  }

  const valueSize = track.getValueSize();
  const nextTime = resolveInsertKeyTime(
    track.times,
    time,
    clip.duration,
    options?.onCollision ?? 'replace',
  );
  if (nextTime === null) {
    return null;
  }

  let nextValues: number[];
  if (values !== undefined) {
    nextValues = Array.from(values);
  } else {
    nextValues = sampleTrackAt(track, nextTime);
  }

  if (nextValues.length !== valueSize) {
    return null;
  }

  const pairs: { time: number; values: number[] }[] = [];
  for (let index = 0; index < track.times.length; index++) {
    const keyTime = Math.fround(track.times[index]);
    if (keyTime === nextTime) {
      continue;
    }
    pairs.push({
      time: keyTime,
      values: Array.from(
        track.values.subarray(index * valueSize, (index + 1) * valueSize),
      ),
    });
  }
  pairs.push({ time: nextTime, values: nextValues });
  pairs.sort((a, b) => a.time - b.time);

  const nextTimes: number[] = [];
  const nextValueFlat: number[] = [];
  let resultIndex = 0;
  for (let index = 0; index < pairs.length; index++) {
    const pair = pairs[index];
    if (pair.time === nextTime) {
      resultIndex = index;
    }
    appendSample(nextTimes, nextValueFlat, pair.time, pair.values);
  }

  track.times = new Float32Array(nextTimes);
  track.values = new Float32Array(nextValueFlat);
  working.duration = clip.duration;
  return { clip: working, keyIndex: resultIndex };
}
