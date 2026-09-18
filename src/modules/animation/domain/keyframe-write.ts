import type { AnimationClip, InterpolationModes, KeyframeTrack } from 'three';

import {
  InterpolateDiscrete,
  InterpolateLinear,
  InterpolateSmooth,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';

import { splitTrackName } from '@/modules/animation/domain/clip-validate';

export interface NodeTRS {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

function appendSample(
  timesOut: number[],
  valuesOut: number[],
  time: number,
  sample: ArrayLike<number>,
): void {
  timesOut.push(time);
  for (let i = 0; i < sample.length; i++) {
    valuesOut.push(sample[i]);
  }
}

/**
 * Write `sample` at `start` and `end` (hold plateau). Drop keys strictly inside
 * `(start, end)` so dense tracks do not slerp the edit away.
 * When `start === end`, upsert a single key at that time.
 */
function writeHoldWindow(
  track: KeyframeTrack,
  start: number,
  end: number,
  sample: ArrayLike<number>,
): void {
  const valueSize = track.getValueSize();
  const times = track.times;
  const values = track.values;
  const nextTimes: number[] = [];
  const nextValues: number[] = [];

  let i = 0;
  while (i < times.length && times[i] < start) {
    appendSample(
      nextTimes,
      nextValues,
      times[i],
      values.subarray(i * valueSize, (i + 1) * valueSize),
    );
    i++;
  }

  appendSample(nextTimes, nextValues, start, sample);

  while (i < times.length && times[i] <= end) {
    i++;
  }

  if (end > start) {
    appendSample(nextTimes, nextValues, end, sample);
  }

  while (i < times.length) {
    appendSample(
      nextTimes,
      nextValues,
      times[i],
      values.subarray(i * valueSize, (i + 1) * valueSize),
    );
    i++;
  }

  track.times = new Float32Array(nextTimes);
  track.values = new Float32Array(nextValues);
}

/**
 * Update every track whose parsed node + suffix match, preserving existing
 * track.name (paths / vendor forms). Create `${nodeName}${suffix}` only when
 * none match — avoids orphan tracks that leave the original animation driving.
 */
function writeHoldTrackData(
  clip: AnimationClip,
  nodeName: string,
  suffix: '.position' | '.quaternion' | '.scale',
  start: number,
  end: number,
  sample: ArrayLike<number>,
  valueSize: number,
): void {
  const matches = clip.tracks.filter((track) => {
    const parsed = splitTrackName(track.name);
    return parsed.nodeName === nodeName && parsed.suffix === suffix;
  });

  if (matches.length > 0) {
    for (const existing of matches) {
      writeHoldWindow(existing, start, end, sample);
    }
    return;
  }

  const name = `${nodeName}${suffix}`;
  const TrackConstructor = valueSize === 4 ? QuaternionKeyframeTrack : VectorKeyframeTrack;
  const startSample = Array.from(sample);
  if (end > start) {
    clip.tracks.push(new TrackConstructor(name, [start, end], [...startSample, ...startSample]));
    return;
  }
  clip.tracks.push(new TrackConstructor(name, [start], startSample));
}

/** Hold edited local TRS from `time` through the end of the clip (default). */
export function writeNodeKeyframe(
  clip: AnimationClip,
  nodeName: string,
  time: number,
  trs: NodeTRS,
  holdEndTime: number = clip.duration,
): AnimationClip {
  const keyTime = Math.fround(time);
  const holdEnd = Math.fround(Math.min(Math.max(holdEndTime, keyTime), clip.duration));
  const working = clip.clone();

  writeHoldTrackData(working, nodeName, '.position', keyTime, holdEnd, trs.position, 3);
  writeHoldTrackData(working, nodeName, '.quaternion', keyTime, holdEnd, trs.quaternion, 4);
  writeHoldTrackData(working, nodeName, '.scale', keyTime, holdEnd, trs.scale, 3);
  working.duration = clip.duration;
  return working;
}

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
export function resolveInsertKeyTime(
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

/** Interpolation modes the UI may offer (Bezier needs tangents — out of scope). */
export type TrackInterpolationMode
  = typeof InterpolateDiscrete
    | typeof InterpolateLinear
    | typeof InterpolateSmooth;

interface TrackInterpolationFactories {
  InterpolantFactoryMethodDiscrete?: unknown;
  InterpolantFactoryMethodLinear?: unknown;
  InterpolantFactoryMethodSmooth?: unknown;
}

const INTERPOLATION_CANDIDATES: TrackInterpolationMode[] = [
  InterpolateDiscrete,
  InterpolateLinear,
  InterpolateSmooth,
];

function factoryForMode(
  track: KeyframeTrack,
  mode: TrackInterpolationMode,
): unknown {
  const factories = track as KeyframeTrack & TrackInterpolationFactories;
  switch (mode) {
    case InterpolateDiscrete:
      return factories.InterpolantFactoryMethodDiscrete;
    case InterpolateLinear:
      return factories.InterpolantFactoryMethodLinear;
    case InterpolateSmooth:
      return factories.InterpolantFactoryMethodSmooth;
  }
}

/** Modes whose factory exists on this track type (Quaternion has no Smooth). */
export function listSupportedTrackInterpolations(
  track: KeyframeTrack,
): TrackInterpolationMode[] {
  return INTERPOLATION_CANDIDATES.filter(
    (mode) => factoryForMode(track, mode) !== undefined,
  );
}

export function getTrackInterpolation(
  track: KeyframeTrack,
): InterpolationModes {
  return track.getInterpolation();
}

export function trackInterpolationLabel(mode: InterpolationModes): string {
  switch (mode) {
    case InterpolateDiscrete:
      return 'Discrete';
    case InterpolateLinear:
      return 'Linear';
    case InterpolateSmooth:
      return 'Smooth';
    default:
      return 'Custom';
  }
}

/**
 * Set track interpolation when the mode is supported. Clones the clip.
 * Returns `null` when the track is missing or the mode is unsupported.
 */
export function setTrackInterpolation(
  clip: AnimationClip,
  trackName: string,
  interpolation: TrackInterpolationMode,
): AnimationClip | null {
  const working = clip.clone();
  const track = working.tracks.find((entry) => entry.name === trackName);
  if (!track) {
    return null;
  }

  if (factoryForMode(track, interpolation) === undefined) {
    return null;
  }

  track.setInterpolation(interpolation);
  if (track.getInterpolation() !== interpolation) {
    return null;
  }

  working.duration = clip.duration;
  return working;
}
