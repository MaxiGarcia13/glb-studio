import type { ClipLibraryState } from '@/modules/animation/types/clip';

import { map } from 'nanostores';

export const $clips = map<ClipLibraryState>({
  clips: [],
  activeClipId: null,
  activeSharedClipId: null,
  activeClipByModelId: {},
  blendBaseClip: null,
  blendClipId: null,
  blendWeight: 0,
  playing: false,
  loop: false,
  duration: 0,
  trimStart: 0,
  trimEnd: 0,
});
