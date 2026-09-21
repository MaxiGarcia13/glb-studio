import type { Object3D } from 'three';

import type { SaveKeyframeSceneNode } from '@/modules/animation/types/undo-stack';
import type { PreEditNodeSnapshot } from '@/modules/viewport/stores/pose-edit-store';
import type { ModelEntry } from '@/modules/viewport/types/model';
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
import {
  $activeModel,
  $model,
} from '@/modules/viewport/stores/model-store';
import {
  $poseDirty,
  $poseEditKind,
  $preEditNodes,
  $preEditTransform,
  clearPoseDirty,

} from '@/modules/viewport/stores/pose-edit-store';
import { $selection } from '@/modules/viewport/stores/selection-store';
import { $clips } from '../store';
import { isReadyClip } from '../utils';

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

function findNode(
  modelId: string,
  nodeUuid: string,
): { model: ModelEntry; node: Object3D } | null {
  const model = $model.get().models.find((entry) => entry.id === modelId);
  if (!model) {
    return null;
  }
  const node
    = model.scene.uuid === nodeUuid
      ? model.scene
      : model.scene.getObjectByProperty('uuid', nodeUuid);
  if (!node) {
    return null;
  }
  return { model, node };
}

function snapshotNodesAfter(
  nodes: readonly PreEditNodeSnapshot[],
): SaveKeyframeSceneNode[] {
  const after: SaveKeyframeSceneNode[] = [];
  for (const entry of nodes) {
    const found = findNode(entry.modelId, entry.nodeUuid);
    if (!found) {
      continue;
    }
    after.push(
      snapshotSaveKeyframeSceneNode(entry.modelId, entry.nodeUuid, found.node),
    );
  }
  return after;
}

/**
 * Multi-select position commit: restore every moved root via `sceneNodes`.
 * With an owned ready clip on the active model, also write keyframes for each
 * node that belongs to that model.
 */
function commitMultiPositionEdit(
  nodes: readonly PreEditNodeSnapshot[],
  holdToEnd: boolean,
): void {
  const beforeNodes = nodes.map((entry) =>
    snapshotSaveKeyframeSceneNode(entry.modelId, entry.nodeUuid, entry.transform),
  );
  const afterNodes = snapshotNodesAfter(nodes);

  const model = $activeModel.get();
  const state = $clips.get();
  const targetClipId = model
    ? clipIdForModel(state, model.id) ?? state.activeClipId
    : state.activeClipId;
  const active = targetClipId
    ? state.clips.find((entry) => entry.id === targetClipId)
    : undefined;
  const ownedReady
    = $poseEditKind.get() === 'selection'
      && Boolean(model)
      && isReadyClip(active)
      && active.ownerModelId === model?.id;

  if (ownedReady && active && model) {
    const timelineTime = readClipTimelineTime();
    const beforeClip = snapshotSaveKeyframeClip(active);
    let working = active.clip;
    for (const entry of nodes) {
      if (entry.modelId !== model.id) {
        continue;
      }
      const found = findNode(entry.modelId, entry.nodeUuid);
      if (!found) {
        continue;
      }
      const { node } = found;
      working = writeNodeKeyframe(
        working,
        node.name || node.uuid,
        timelineTime,
        {
          position: [node.position.x, node.position.y, node.position.z],
          quaternion: [
            node.quaternion.x,
            node.quaternion.y,
            node.quaternion.z,
            node.quaternion.w,
          ],
          scale: [node.scale.x, node.scale.y, node.scale.z],
        },
        holdToEnd ? active.clip.duration : timelineTime,
      );
    }
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
        before: { clips: [beforeClip], sceneNodes: beforeNodes },
        after: {
          clips: [{ clipId: active.id, clip: working.clone() }],
          sceneNodes: afterNodes,
        },
      });
    }
    clearPoseDirty();
    return;
  }

  for (const entry of nodes) {
    const found = findNode(entry.modelId, entry.nodeUuid);
    if (found) {
      refreshRestPoseNode(found.model.scene, found.node);
    }
  }

  pushUndoableCommand({
    id: 'saveKeyframe',
    clipId: model?.id ?? nodes[0]?.modelId ?? 'multi',
    before: { clips: [], sceneNodes: beforeNodes },
    after: { clips: [], sceneNodes: afterNodes },
  });
  resumeMixerBindings();
  clearPoseDirty();
}

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

export function saveKeyframe(options?: { holdToEnd?: boolean }): void {
  if (!$poseDirty.get()) {
    return;
  }

  const holdToEnd = options?.holdToEnd ?? true;
  const preEditNodes = $preEditNodes.get();
  if (preEditNodes && preEditNodes.length > 1) {
    commitMultiPositionEdit(preEditNodes, holdToEnd);
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
  // Still push sceneNode undo so Edit gizmo / inspector TRS can be reversed.
  if (model?.source === 'created') {
    const ownedReady
      = isReadyClip(active) && active.ownerModelId === model.id;
    if (!ownedReady) {
      const preEdit = $preEditTransform.get();
      if (preEdit) {
        pushUndoableCommand({
          id: 'saveKeyframe',
          clipId: model.id,
          before: {
            clips: [],
            sceneNode: snapshotSaveKeyframeSceneNode(
              model.id,
              object.uuid,
              preEdit,
            ),
          },
          after: {
            clips: [],
            sceneNode: snapshotSaveKeyframeSceneNode(
              model.id,
              object.uuid,
              object,
            ),
          },
        });
      }
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
