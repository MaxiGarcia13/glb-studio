import type { RefObject } from 'react';
import type { AnimationMixer } from 'three';

import { useFrame } from '@react-three/fiber';

import { $clips, pause } from '@/modules/animation/stores/clip-store';
import { $poseDirty } from '@/modules/viewport/stores/pose-edit-store';

export function useClipMixerFrame(
  mixerRef: RefObject<AnimationMixer | null>,
  endTime: number,
): void {
  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    if (!mixer) {
      return;
    }
    const state = $clips.get();
    // Pose edits suspend bindings; never overwrite while dirty.
    if (!state.playing || $poseDirty.get()) {
      return;
    }
    mixer.update(delta);
    if (!state.loop && endTime > 0 && mixer.time >= endTime) {
      pause();
    }
  });
}
