import type { Object3D } from 'three';
import type { RemapClipOptions } from '@/modules/animation/domain/clip-remap';
import type { BoneBindFrame, ClipEntry } from '@/modules/animation/types/clip';

import { captureBindFrames } from '@/modules/animation/domain/bind-frame';
import { computePositionScaleRatio } from '@/modules/animation/domain/bind-length-ratio';
import { remapClipTracks } from '@/modules/animation/domain/clip-remap';
import { splitTrackName } from '@/modules/animation/domain/clip-validate';
import { getBindFrame, resolveHipsMapping } from '@/modules/animation/domain/hips-mapping';
import {
  applyBoneRenames,
  buildBoneRenamesForScene,
} from '@/modules/animation/domain/normalize-scene-bones';
import { setMixerTime, setMixerTimeScale } from '@/modules/animation/utils/mixer-session';
import { $model } from '@/modules/viewport/stores/model-store';
import { $clips } from '../store';
import { applyActiveModelBindOverrides, nextClipId } from '../utils';
import { syncClipsToSkeleton } from './sync-clips-to-skeleton';

export type RetargetScope = 'active' | 'all';

export interface RetargetClipOptions {
  scope: RetargetScope;
  /** Target model scene — bind lengths/frames and re-sync. */
  activeScene: Object3D | null;
  /** Model that receives the remapped owned clip (scope `active`). */
  targetModelId?: string | null;
}

export interface RetargetClipResult {
  clipId: string | null;
  error: string | null;
}

const NO_SCALE_PAIRS_ERROR
  = 'No usable source/target bone pairs for position scale — the clip or model may have no bones';

const NO_HIPS_REBASE_ERROR
  = 'Cannot rebase hips for position tracks — map Hips and ensure the clip/model skeletons loaded correctly';

function clipHasPositionTracks(clip: { tracks: { name: string }[] }): boolean {
  return clip.tracks.some((track) => splitTrackName(track.name).suffix === '.position');
}

function computeScaleOrFail(
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

function buildRemapOptionsOrFail(
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

function remapSourceOrFail(
  source: ClipEntry,
  mapping: Map<string, string>,
  targetScene: Object3D | null,
): { clip: NonNullable<ClipEntry['clip']> } | { error: string } {
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

function commitRetargetedClip(
  remapped: ClipEntry,
  targetModelId: string | null,
): void {
  const duration = remapped.clip?.duration ?? 0;
  const state = $clips.get();
  $clips.set({
    ...state,
    clips: state.clips.map((entry) => (entry.id === remapped.id ? remapped : entry)),
    activeClipId: remapped.id,
    activeSharedClipId: remapped.ownerModelId === null ? remapped.id : null,
    activeClipByModelId: targetModelId
      ? {
          ...state.activeClipByModelId,
          [targetModelId]: remapped.id,
        }
      : state.activeClipByModelId,
    playing: false,
    duration,
    trimStart: 0,
    trimEnd: duration,
  });
  setMixerTime(0);
  setMixerTimeScale(remapped.timeScale);
}

function retargetActiveInPlace(
  source: ClipEntry,
  mapping: Map<string, string>,
  targetScene: Object3D | null,
  targetModelId: string,
): RetargetClipResult {
  const remappedClip = remapSourceOrFail(source, mapping, targetScene);
  if ('error' in remappedClip) {
    return { clipId: null, error: remappedClip.error };
  }

  const remapped = applyActiveModelBindOverrides({
    ...source,
    name: source.name,
    clip: remappedClip.clip,
    sourceClip: remappedClip.clip,
    status: 'ready' as const,
    error: null,
  }, targetModelId);

  commitRetargetedClip(remapped, targetModelId);
  syncClipsToSkeleton(targetScene);
  return { clipId: remapped.id, error: null };
}

function retargetActiveAsOwnedCopy(
  source: ClipEntry,
  mapping: Map<string, string>,
  targetScene: Object3D | null,
  targetModelId: string,
): RetargetClipResult {
  const remappedClip = remapSourceOrFail(source, mapping, targetScene);
  if ('error' in remappedClip) {
    return { clipId: null, error: remappedClip.error };
  }

  const newId = nextClipId();
  const newEntry = applyActiveModelBindOverrides({
    id: `${newId}-${source.name}`,
    name: source.name,
    sourceFile: source.sourceFile,
    clip: remappedClip.clip,
    sourceClip: remappedClip.clip,
    status: 'ready' as const,
    error: null,
    timeScale: source.timeScale,
    sourceBindLengths: source.sourceBindLengths ?? {},
    sourceBindFrames: source.sourceBindFrames ?? {},
    ownerModelId: targetModelId,
    rootPositionByModelId: {},
    rootRotationByModelId: {},
  }, targetModelId);

  const state = $clips.get();
  const duration = newEntry.clip?.duration ?? remappedClip.clip.duration;
  const fromShared = source.ownerModelId === null;
  $clips.set({
    ...state,
    clips: [...state.clips, newEntry],
    activeClipId: newEntry.id,
    activeSharedClipId: fromShared ? state.activeSharedClipId : null,
    activeClipByModelId: {
      ...state.activeClipByModelId,
      [targetModelId]: newEntry.id,
    },
    playing: false,
    duration,
    trimStart: 0,
    trimEnd: duration,
  });

  setMixerTime(0);
  setMixerTimeScale(newEntry.timeScale);
  return { clipId: newEntry.id, error: null };
}

function retargetActive(
  id: string,
  mapping: Map<string, string>,
  activeScene: Object3D | null,
  targetModelId: string | null,
): RetargetClipResult {
  const state = $clips.get();
  const source = state.clips.find((entry) => entry.id === id);
  if (!source?.clip) {
    return { clipId: null, error: 'Clip not found' };
  }

  if (!targetModelId) {
    return { clipId: null, error: 'Focus a model in the viewport to retarget onto.' };
  }

  const targetModel = $model.get().models.find((model) => model.id === targetModelId);
  if (!targetModel) {
    return { clipId: null, error: 'Model not found' };
  }

  const targetScene = activeScene ?? targetModel.scene;

  if (source.ownerModelId === targetModelId) {
    return retargetActiveInPlace(source, mapping, targetScene, targetModelId);
  }

  return retargetActiveAsOwnedCopy(source, mapping, targetScene, targetModelId);
}

function retargetAllModels(
  id: string,
  mapping: Map<string, string>,
  activeScene: Object3D | null,
): RetargetClipResult {
  const state = $clips.get();
  const source = state.clips.find((entry) => entry.id === id);
  if (!source?.clip) {
    return { clipId: null, error: 'Clip not found' };
  }

  const models = $model.get().models;
  if (models.length === 0) {
    return { clipId: null, error: 'No models loaded' };
  }

  const compatible: { scene: Object3D; renames: Map<string, string> }[] = [];

  for (const model of models) {
    const { renames, error } = buildBoneRenamesForScene(model.scene, mapping);
    if (!error) {
      compatible.push({ scene: model.scene, renames });
    }
  }

  const remappedClip = remapSourceOrFail(source, mapping, activeScene);
  if ('error' in remappedClip) {
    return { clipId: null, error: remappedClip.error };
  }

  for (const { scene, renames } of compatible) {
    applyBoneRenames(scene, renames);
  }

  const remapped = applyActiveModelBindOverrides({
    ...source,
    name: source.name,
    clip: remappedClip.clip,
    sourceClip: remappedClip.clip,
    status: 'ready' as const,
    error: null,
  });

  const duration = remapped.clip?.duration ?? remappedClip.clip.duration;
  $clips.set({
    ...state,
    clips: state.clips.map((entry) => (entry.id === id ? remapped : entry)),
    activeClipId: id,
    playing: false,
    duration,
    trimStart: 0,
    trimEnd: duration,
  });

  syncClipsToSkeleton(activeScene);
  setMixerTime(0);
  setMixerTimeScale(remapped.timeScale);
  return { clipId: id, error: null };
}

export function retargetClip(
  id: string,
  mapping: Map<string, string>,
  options: RetargetClipOptions = { scope: 'active', activeScene: null },
): RetargetClipResult {
  if (options.scope === 'all') {
    return retargetAllModels(id, mapping, options.activeScene);
  }
  return retargetActive(id, mapping, options.activeScene, options.targetModelId ?? null);
}
