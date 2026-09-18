import {
  computeBindPoseDelta,
  rebaseClipEntriesForNode,
} from '@/modules/animation/domain/bind-pose-rebase';
import { writeNodeKeyframe } from '@/modules/animation/domain/keyframe-hold';
import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import {
  applySceneRootTransform,
  readObjectRootTrs,
  refreshRestPoseNode,
} from '@/modules/animation/domain/rest-pose';
import {
  snapshotSaveKeyframeBindPoseCommit,
  snapshotSaveKeyframeClip,
  snapshotSaveKeyframeRoots,
  snapshotSaveKeyframeSceneNode,
  withModelRootTrs,
} from '@/modules/animation/domain/undo-snapshots';
import {
  $bindPoseOverrides,
  accumulateBindPoseDelta,
} from '@/modules/animation/stores/bind-pose-store';
import { pushUndoableCommand } from '@/modules/animation/stores/undo-stack-store';
import {
  resumeMixerBindings,
  setMixerTime,
} from '@/modules/animation/utils/mixer-session';
import { readClipTimelineTime } from '@/modules/animation/utils/to-timeline-time';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  $poseDirty,
  $poseEditKind,
  $preEditTransform,
  clearPoseDirty,
} from '@/modules/viewport/stores/pose-edit-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { $clips } from '../store';
import { isReadyClip } from '../utils';

function commitBindPoseToClips(nodeName: string): boolean {
  const snapshot = $preEditTransform.get();
  const object = $selection.get().object;
  const model = $activeModel.get();
  if (!snapshot || !object || !model) {
    return false;
  }

  const delta = computeBindPoseDelta(snapshot, object);
  accumulateBindPoseDelta(model.id, nodeName, delta);
  refreshRestPoseNode(model.scene, object);

  const state = $clips.get();
  $clips.set({
    ...state,
    clips: rebaseClipEntriesForNode(state.clips, nodeName, delta),
  });
  return true;
}

/** Clip currently driving this model (owned selection, else shared / same-name override). */
function clipIdForModel(
  state: ReturnType<typeof $clips.get>,
  modelId: string,
): string | null {
  return resolveActiveClipIdForModel(
    state.clips,
    modelId,
    state.activeClipByModelId,
    state.activeSharedClipId,
  );
}

export function saveKeyframe(options?: { holdToEnd?: boolean }): void {
  if (!$poseDirty.get()) {
    return;
  }

  const kind = $poseEditKind.get();
  const model = $activeModel.get();
  const object
    = kind === 'modelRoot'
      ? model?.scene ?? null
      : $selection.get().object;
  if (!object) {
    return;
  }

  const state = $clips.get();
  const holdToEnd = options?.holdToEnd ?? true;

  // Model-root commit: TRS already on the scene — always scoped to the active model.
  if (kind === 'modelRoot') {
    if (model) {
      const modelClipId = clipIdForModel(state, model.id);
      const modelClip = modelClipId
        ? state.clips.find((entry) => entry.id === modelClipId)
        : undefined;

      if (isReadyClip(modelClip)) {
        const root = readObjectRootTrs(object);
        const before = {
          clips: [snapshotSaveKeyframeRoots(modelClip)],
        };
        const afterEntry = withModelRootTrs(modelClip, model.id, root);
        // Clear dirty before publishing so the mixer effect does not skip apply.
        clearPoseDirty();
        $clips.set({
          ...state,
          clips: state.clips.map((entry) =>
            entry.id === modelClip.id ? afterEntry : entry,
          ),
        });
        applySceneRootTransform(
          model.scene,
          root.position,
          root.rotation,
          root.scale,
        );
        pushUndoableCommand({
          id: 'saveKeyframe',
          clipId: modelClip.id,
          before,
          after: { clips: [snapshotSaveKeyframeRoots(afterEntry)] },
        });
        // Clip begins at t=0 under the saved root on this model only.
        setMixerTime(0);
        return;
      }
      refreshRestPoseNode(model.scene, object);
    }
    resumeMixerBindings();
    clearPoseDirty();
    return;
  }

  // Prefer the clip driving this model (owned override / shared), not only UI focus.
  const targetClipId = model
    ? clipIdForModel(state, model.id) ?? state.activeClipId
    : state.activeClipId;
  const active = targetClipId
    ? state.clips.find((entry) => entry.id === targetClipId)
    : undefined;

  // Created parts (US-23): Hold Pose only into a ready clip **owned by this model**.
  // Shared / other-owned driving clips must not gain part tracks (e.g. `capsule.*`),
  // or character clips pick up Needs-retarget mismatches.
  if (model?.source === 'created') {
    const ownedReady
      = isReadyClip(active) && active.ownerModelId === model.id;
    if (!ownedReady) {
      refreshRestPoseNode(model.scene, object);
      resumeMixerBindings();
      clearPoseDirty();
      return;
    }
  }

  // Bind-pose commit (no ready clip): scene TRS + rebase all library clips.
  // Created models never reach here without an owned ready clip (handled above).
  if (!isReadyClip(active)) {
    const preEdit = $preEditTransform.get();
    if (!model || !preEdit) {
      resumeMixerBindings();
      clearPoseDirty();
      return;
    }
    const nodeName = object.name || object.uuid;
    const before = {
      ...snapshotSaveKeyframeBindPoseCommit(
        state.clips,
        $bindPoseOverrides.get(),
      ),
      sceneNode: snapshotSaveKeyframeSceneNode(model.id, object.uuid, preEdit),
    };
    if (!commitBindPoseToClips(nodeName)) {
      resumeMixerBindings();
      clearPoseDirty();
      return;
    }
    const after = {
      ...snapshotSaveKeyframeBindPoseCommit(
        $clips.get().clips,
        $bindPoseOverrides.get(),
      ),
      sceneNode: snapshotSaveKeyframeSceneNode(model.id, object.uuid, object),
    };
    const clipId
      = targetClipId
        ?? state.activeClipId
        ?? before.clips[0]?.clipId
        ?? model.id;
    pushUndoableCommand({
      id: 'saveKeyframe',
      clipId,
      before,
      after,
    });
    resumeMixerBindings();
    clearPoseDirty();
    return;
  }

  const nodeName = object.name || object.uuid;
  const timelineTime = readClipTimelineTime();
  const beforeClip = snapshotSaveKeyframeClip(active);
  const working = writeNodeKeyframe(
    active.clip,
    nodeName,
    timelineTime,
    {
      position: [object.position.x, object.position.y, object.position.z],
      quaternion: [
        object.quaternion.x,
        object.quaternion.y,
        object.quaternion.z,
        object.quaternion.w,
      ],
      scale: [object.scale.x, object.scale.y, object.scale.z],
    },
    holdToEnd ? active.clip.duration : timelineTime,
  );

  // Drop blend preview so the mixer effect binds `working`, not a stale base snapshot.
  $clips.set({
    ...state,
    clips: state.clips.map((entry) =>
      entry.id === active.id ? { ...entry, clip: working } : entry,
    ),
    duration: working.duration,
    blendBaseClip: null,
    blendClipId: null,
    blendWeight: 0,
  });
  if (beforeClip) {
    pushUndoableCommand({
      id: 'saveKeyframe',
      clipId: active.id,
      before: { clips: [beforeClip] },
      after: { clips: [{ clipId: active.id, clip: working.clone() }] },
    });
  }
  // Keep the old action suspended. Do not restoreMixerPose / resume / rebind here —
  // those race the React actionRef and leave playback/scrubber on a dead mixer action.
  // useClipMixerAction rebinds `working` and enables the new action.
  clearPoseDirty();
}
