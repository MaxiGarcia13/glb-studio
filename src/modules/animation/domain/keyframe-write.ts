import type { AnimationClip, KeyframeTrack } from 'three';

import { QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';

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
