import type { AnimationAction, AnimationMixer, Group } from 'three';
import { useStore } from '@nanostores/react';
import { useRef } from 'react';
import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import { $clips, isReadyClip } from '@/modules/animation/stores/clip-store';
import { useClipMixerAction } from './use-clip-mixer-action';
import { useClipMixerBlend } from './use-clip-mixer-blend';
import { useClipMixerFrame } from './use-clip-mixer-frame';
import { useClipMixerMount } from './use-clip-mixer-mount';

export function useClipMixer(scene: Group | null, modelId: string): void {
  const mixerRef = useRef<AnimationMixer | null>(null);
  const actionRef = useRef<AnimationAction | null>(null);
  const blendActionRef = useRef<AnimationAction | null>(null);

  const {
    activeSharedClipId,
    activeClipByModelId,
    blendBaseClip,
    blendClipId,
    blendWeight,
    playing,
    loop,
    clips,
  } = useStore($clips, {
    keys: [
      'activeSharedClipId',
      'activeClipByModelId',
      'blendBaseClip',
      'blendClipId',
      'blendWeight',
      'playing',
      'loop',
      'clips',
    ],
  });

  const activeClipId = resolveActiveClipIdForModel(
    clips,
    modelId,
    activeClipByModelId,
    activeSharedClipId,
  );

  const entry = clips.find((item) => item.id === activeClipId);
  // While blending, preview layers base + partner; the baked result lives on the entry.
  const clip
    = blendClipId && blendBaseClip
      ? blendBaseClip
      : isReadyClip(entry)
        ? entry.clip
        : null;
  const rootPosition
    = isReadyClip(entry) ? (entry.rootPositionByModelId[modelId] ?? null) : null;
  const rootRotation
    = isReadyClip(entry) ? (entry.rootRotationByModelId[modelId] ?? null) : null;

  const blendEntry = clips.find((item) => item.id === blendClipId);
  const blendClip = isReadyClip(blendEntry) ? blendEntry.clip : null;

  useClipMixerMount(scene, activeClipId, modelId, mixerRef, actionRef, blendActionRef);
  useClipMixerAction(
    clip,
    rootPosition,
    rootRotation,
    playing,
    loop,
    modelId,
    mixerRef,
    actionRef,
    scene,
  );
  useClipMixerBlend(blendClip, blendWeight, loop, modelId, mixerRef, blendActionRef, scene);
  useClipMixerFrame(mixerRef, clip?.duration ?? 0);
}
