import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import { applyRestPose, applySceneRootTransform } from '@/modules/animation/domain/rest-pose';
import {
  getMixerRoot,
  listRegisteredMixerModelIds,
  rebindMixerClip,
} from '@/modules/animation/utils/mixer-session';
import { $clips } from '../store';
import { isReadyClip } from '../utils';

/**
 * Rebind preview mixers whose driving clip is in `clipIds`, then apply stored
 * model-root TRS. Rest-pose first so a post-Save gizmo pose cannot stick when
 * PropertyMixer would skip setTime at the same playhead.
 */
export function rebindMixersForClips(
  clipIds: ReadonlySet<string>,
  options?: { resetTime?: boolean },
): void {
  if (clipIds.size === 0) {
    return;
  }

  const clipState = $clips.get();

  for (const modelId of listRegisteredMixerModelIds()) {
    const drivingId = resolveActiveClipIdForModel(
      clipState.clips,
      modelId,
      clipState.activeClipByModelId,
      clipState.activeSharedClipId,
    );
    if (!drivingId || !clipIds.has(drivingId)) {
      continue;
    }

    const entry = clipState.clips.find((clip) => clip.id === drivingId);
    const clip = isReadyClip(entry) ? entry.clip : null;
    const root = getMixerRoot(modelId);

    // Clear leftover Save / gizmo TRS before sampling the restored clip.
    if (root) {
      applyRestPose(root);
    }

    if (!clip) {
      rebindMixerClip(modelId, null, 0);
      continue;
    }

    rebindMixerClip(modelId, clip, options?.resetTime ? 0 : undefined);

    if (root && isReadyClip(entry)) {
      applySceneRootTransform(
        root,
        entry.rootPositionByModelId[modelId] ?? null,
        entry.rootRotationByModelId[modelId] ?? null,
        entry.rootScaleByModelId[modelId] ?? null,
      );
    }
  }
}
