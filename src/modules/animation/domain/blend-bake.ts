import type { KeyframeTrack } from 'three';

import { AnimationClip, Quaternion } from 'three';

interface TrackInterpolant {
  evaluate: (time: number) => Float32Array;
}

/** Interpolate a track at `time` (types omit the public `createInterpolant`). */
function sampleAt(track: KeyframeTrack, time: number): Float32Array {
  const trackWithFactory = track as unknown as { createInterpolant: () => TrackInterpolant };
  return trackWithFactory.createInterpolant().evaluate(time);
}

function blendDisplayName(primary: AnimationClip, secondary: AnimationClip): string {
  return `${primary.name} + ${secondary.name}`;
}

function collectSampleTimes(a: KeyframeTrack | undefined, b: KeyframeTrack | undefined, duration: number): Float32Array {
  const times = new Set<number>();
  if (a) {
    for (const t of a.times) {
      times.add(t);
    }
  }
  if (b) {
    for (const t of b.times) {
      times.add(t);
    }
  }
  times.add(0);
  times.add(duration);
  return new Float32Array(Array.from(times).sort((x, y) => x - y));
}

function blendInto(
  sampleA: Float32Array,
  sampleB: Float32Array,
  weightB: number,
  valueSize: number,
  out: Float32Array,
  quatA: Quaternion,
  quatB: Quaternion,
  quatOut: Quaternion,
): void {
  if (valueSize === 4) {
    quatA.fromArray(sampleA, 0);
    quatB.fromArray(sampleB, 0);
    quatOut.slerpQuaternions(quatA, quatB, weightB);
    quatOut.toArray(out, 0);
    return;
  }
  for (let i = 0; i < valueSize; i++) {
    out[i] = sampleA[i] + (sampleB[i] - sampleA[i]) * weightB;
  }
}

function blendTrack(
  a: KeyframeTrack | undefined,
  b: KeyframeTrack | undefined,
  duration: number,
  weightB: number,
  quatA: Quaternion,
  quatB: Quaternion,
  quatOut: Quaternion,
): KeyframeTrack {
  const template = (a ?? b)!.clone();
  const valueSize = template.getValueSize();
  const times = collectSampleTimes(a, b, duration);
  const valuesOut = new Float32Array(times.length * valueSize);
  const sampleA = new Float32Array(valueSize);
  const sampleB = new Float32Array(valueSize);
  const out = new Float32Array(valueSize);

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (a) {
      sampleA.set(sampleAt(a, time));
    }
    if (b) {
      sampleB.set(sampleAt(b, time));
    }

    if (a && b) {
      blendInto(sampleA, sampleB, weightB, valueSize, out, quatA, quatB, quatOut);
      valuesOut.set(out, i * valueSize);
    } else if (a) {
      valuesOut.set(sampleA, i * valueSize);
    } else {
      valuesOut.set(sampleB, i * valueSize);
    }
  }

  template.times = times;
  template.values = valuesOut;
  return template;
}

/**
 * Bake the current steady-state blend of `primary` + `secondary` at `blendWeight`
 * into one `AnimationClip` lasting `primary.duration` (the timeline window).
 * Secondary is clamped to its last key past its end; a live A→B cross-fade folds
 * in at the destination weight per the export contract.
 */
export function bakeBlendClip(
  primary: AnimationClip,
  secondary: AnimationClip,
  blendWeight: number,
): AnimationClip {
  const weight = Math.min(Math.max(blendWeight, 0), 1);
  const duration = primary.duration;
  const trackNames = new Set<string>();
  for (const track of [...primary.tracks, ...secondary.tracks]) {
    trackNames.add(track.name);
  }

  const quatA = new Quaternion();
  const quatB = new Quaternion();
  const quatOut = new Quaternion();

  const tracks: KeyframeTrack[] = [];
  for (const name of trackNames) {
    tracks.push(
      blendTrack(
        primary.tracks.find((track) => track.name === name),
        secondary.tracks.find((track) => track.name === name),
        duration,
        weight,
        quatA,
        quatB,
        quatOut,
      ),
    );
  }

  const clip = new AnimationClip(blendDisplayName(primary, secondary), duration, tracks, primary.blendMode);
  return clip;
}
