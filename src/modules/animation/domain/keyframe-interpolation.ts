import type { AnimationClip, InterpolationModes, KeyframeTrack } from 'three';

import {
  InterpolateDiscrete,
  InterpolateLinear,
  InterpolateSmooth,
} from 'three';

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
