import type { Object3D } from 'three';
import type { ClipEntry } from '@/modules/animation/types/clip';
import { loadClipsFromFile } from '@/modules/animation/adapters/clip-loader';
import { buildSkeletonNodeSet, validateClipAgainstSkeleton } from '@/modules/animation/domain/clip-validate';
import { setMixerTime, setMixerTimeScale } from '@/modules/animation/utils/mixer-session';
import { $clips } from '../store';
import { applyActiveModelBindOverrides, isReadyClip, toEntry } from '../utils';
import { selectClip } from './select-clip';

export async function replaceClip(
  id: string,
  file: File,
  skeleton: Object3D | null,
): Promise<void> {
  if (!skeleton) {
    return;
  }

  const state = $clips.get();
  const index = state.clips.findIndex((entry) => entry.id === id);
  if (index < 0) {
    return;
  }

  const nodeNames = buildSkeletonNodeSet(skeleton);
  const previous = state.clips[index];

  try {
    const result = await loadClipsFromFile(file);
    const clip = result.clips[0];
    if (!clip) {
      throw new Error(`File "${file.name}" contains no animation clips`);
    }

    const validation = validateClipAgainstSkeleton(clip, nodeNames);
    const nextEntry = applyActiveModelBindOverrides({
      ...toEntry(
        validation,
        previous.id,
        clip,
        result.name,
        result.sourceBindLengths,
        result.sourceBindFrames,
        previous.ownerModelId,
      ),
      id: previous.id,
    });

    const clips = [...state.clips];
    clips[index] = nextEntry;
    applyReplacedEntry(clips, id, nextEntry.status === 'ready');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to replace clip';
    const clips = [...state.clips];
    clips[index] = {
      ...previous,
      name: file.name,
      sourceFile: file.name,
      clip: null,
      status: 'error',
      error: message,
    };
    applyReplacedEntry(clips, id, false);
  }
}

function applyReplacedEntry(clips: ClipEntry[], id: string, replacedIsReady: boolean): void {
  const state = $clips.get();
  const wasActive = state.activeClipId === id;
  const wasBlend = state.blendClipId === id;
  const blendClipId = wasBlend && !replacedIsReady ? null : state.blendClipId;
  const blendWeight = blendClipId ? state.blendWeight : 0;

  if (!wasActive) {
    $clips.set({ ...state, clips, blendClipId, blendWeight });
    return;
  }

  if (replacedIsReady) {
    setMixerTime(0);
    const active = clips.find((entry) => entry.id === id);
    const activeDuration = active && isReadyClip(active) ? active.clip.duration : 0;
    setMixerTimeScale(active?.timeScale ?? 1);
    $clips.set({
      ...state,
      clips,
      blendClipId,
      blendWeight,
      playing: false,
      duration: activeDuration,
      trimStart: 0,
      trimEnd: activeDuration,
    });
    return;
  }

  const nextReady = clips.find((entry) => entry.id !== id && isReadyClip(entry));
  $clips.set({
    ...state,
    clips,
    blendClipId,
    blendWeight,
    activeClipId: null,
    activeSharedClipId: null,
    activeClipByModelId: {},
    playing: false,
    duration: 0,
  });

  if (nextReady) {
    selectClip(nextReady.id);
  }
}
