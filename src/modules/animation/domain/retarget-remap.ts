import type { AnimationClip, Object3D } from 'three';
import type { RemapClipOptions } from '@/modules/animation/domain/clip-remap';
import type { BoneBindFrame, ClipEntry } from '@/modules/animation/types/clip';

import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { computePositionScaleRatio } from '@/modules/animation/domain/bind-length-ratio';
import { remapClipTracks } from '@/modules/animation/domain/clip-remap';
import { splitTrackName } from '@/modules/animation/domain/clip-validate';
import { getBindFrame, resolveHipsMapping } from '@/modules/animation/domain/hips-mapping';

export const NO_SCALE_PAIRS_ERROR
  = 'No usable source/target bone pairs for position scale — the clip or model may have no bones';

export const NO_HIPS_REBASE_ERROR
  = 'Cannot rebase hips for position tracks — map Hips and ensure the clip/model skeletons loaded correctly';

export function clipHasPositionTracks(clip: { tracks: { name: string }[] }): boolean {
  return clip.tracks.some((track) => splitTrackName(track.name).suffix === '.position');
}

export function computeScaleOrFail(
  sourceBindLengths: Record<string, number>,
  mapping: Map<string, string>,
  activeScene: Object3D | null,
): { ratio: number } | { error: string } {
  if (!activeScene) {
    return { error: NO_SCALE_PAIRS_ERROR };
  }
  const ratio = computePositionScaleRatio(mapping, sourceBindLengths, activeScene);
  return ratio === null ? { error: NO_SCALE_PAIRS_ERROR } : { ratio };
}

export function buildRemapOptionsOrFail(
  mapping: Map<string, string>,
  sourceBindFrames: Record<string, BoneBindFrame>,
  activeScene: Object3D | null,
  positionScale: number,
  sourceClip: { tracks: { name: string }[] },
): { options: RemapClipOptions } | { error: string } {
  const options: RemapClipOptions = { positionScale };

  if (!clipHasPositionTracks(sourceClip)) {
    return { options };
  }

  const hips = resolveHipsMapping(mapping);
  if (!hips || !activeScene) {
    return { error: NO_HIPS_REBASE_ERROR };
  }

  const sourceFrame = getBindFrame(sourceBindFrames, hips.sourceName);
  const targetFrames = captureBindFrames(activeScene);
  const targetFrame = getBindFrame(targetFrames, hips.targetName);
  if (
    !sourceFrame?.localPosition
    || !targetFrame?.localPosition
    || !sourceFrame.parentWorldQuaternion
    || !targetFrame.parentWorldQuaternion
  ) {
    return { error: NO_HIPS_REBASE_ERROR };
  }

  options.hipsSourceBone = hips.sourceName;
  options.hipsRebase = {
    sourceParentWorldQuaternion: sourceFrame.parentWorldQuaternion,
    targetParentWorldQuaternion: targetFrame.parentWorldQuaternion,
    sourceBindLocalPosition: sourceFrame.localPosition,
    targetBindLocalPosition: targetFrame.localPosition,
  };
  return { options };
}

/** Remap `source` onto `targetScene` using `mapping`, or a user-facing error. */
export function remapSourceOrFail(
  source: ClipEntry,
  mapping: Map<string, string>,
  targetScene: Object3D | null,
): { clip: AnimationClip } | { error: string } {
  if (!source.clip) {
    return { error: 'Clip not found' };
  }

  const scale = computeScaleOrFail(source.sourceBindLengths, mapping, targetScene);
  if ('error' in scale) {
    return { error: scale.error };
  }

  const remapOpts = buildRemapOptionsOrFail(
    mapping,
    source.sourceBindFrames ?? {},
    targetScene,
    scale.ratio,
    source.clip,
  );
  if ('error' in remapOpts) {
    return { error: remapOpts.error };
  }

  const result = remapClipTracks(source.clip, mapping, remapOpts.options);
  if (!result.clip || result.error) {
    return { error: result.error ?? 'Remap failed' };
  }

  return { clip: result.clip };
}
