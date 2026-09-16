import type { Object3D } from 'three';
import {
  computeBindPoseDelta,
  rebaseClipNode,
} from '@/modules/animation/domain/bind-pose-rebase';
import { writeNodeKeyframe } from '@/modules/animation/domain/keyframe-write';
import { resolveActiveClipIdForModel } from '@/modules/animation/domain/resolve-active-clip';
import {
  applySceneRootTransform,
  refreshRestPoseNode,
} from '@/modules/animation/domain/rest-pose';
import {
  accumulateBindPoseDelta,
} from '@/modules/animation/stores/bind-pose-store';
import {
  resumeMixerBindings,
  setMixerTime,
} from '@/modules/animation/utils/mixer-session';
import { readClipTimelineTime } from '@/modules/animation/utils/to-timeline-time';
import { radiansToDegrees } from '@/modules/viewport/domain/euler-degrees';
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

function commitBindPoseToClips(nodeName: string): void {
  const snapshot = $preEditTransform.get();
  const object = $selection.get().object;
  const model = $activeModel.get();
  if (!snapshot || !object || !model) {
    return;
  }

  const delta = computeBindPoseDelta(snapshot, object);
  accumulateBindPoseDelta(model.id, nodeName, delta);
  refreshRestPoseNode(model.scene, object);

  const state = $clips.get();
  const clips = state.clips.map((entry) => {
    if (!entry.clip) {
      return entry;
    }
    const clip = entry.clip.clone();
    rebaseClipNode(clip, nodeName, delta);
    const sourceClip
      = entry.sourceClip && entry.sourceClip !== entry.clip
        ? rebaseClipNode(entry.sourceClip.clone(), nodeName, delta)
        : clip;
    return { ...entry, clip, sourceClip };
  });

  $clips.set({ ...state, clips });
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

function readRootRotationDegrees(object: Object3D): [number, number, number] {
  object.rotation.setFromQuaternion(object.quaternion, 'XYZ');
  return [
    radiansToDegrees(object.rotation.x),
    radiansToDegrees(object.rotation.y),
    radiansToDegrees(object.rotation.z),
  ];
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
        const rootPosition: [number, number, number] = [
          object.position.x,
          object.position.y,
          object.position.z,
        ];
        const rootRotation = readRootRotationDegrees(object);
        const rootScale: [number, number, number] = [
          object.scale.x,
          object.scale.y,
          object.scale.z,
        ];
        // Clear dirty before publishing so the mixer effect does not skip apply.
        clearPoseDirty();
        $clips.set({
          ...state,
          clips: state.clips.map((entry) =>
            entry.id === modelClip.id
              ? {
                  ...entry,
                  rootPositionByModelId: {
                    ...entry.rootPositionByModelId,
                    [model.id]: rootPosition,
                  },
                  rootRotationByModelId: {
                    ...entry.rootRotationByModelId,
                    [model.id]: rootRotation,
                  },
                  rootScaleByModelId: {
                    ...entry.rootScaleByModelId,
                    [model.id]: rootScale,
                  },
                }
              : entry,
          ),
        });
        applySceneRootTransform(model.scene, rootPosition, rootRotation, rootScale);
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
    const nodeName = object.name || object.uuid;
    commitBindPoseToClips(nodeName);
    resumeMixerBindings();
    clearPoseDirty();
    return;
  }

  const nodeName = object.name || object.uuid;
  const timelineTime = readClipTimelineTime();
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
  // Keep the old action suspended. Do not restoreMixerPose / resume / rebind here —
  // those race the React actionRef and leave playback/scrubber on a dead mixer action.
  // useClipMixerAction rebinds `working` and enables the new action.
  clearPoseDirty();
}
