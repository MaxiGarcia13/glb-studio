# US-21 design

## Scope

Extend US-15 Move / Settings root placement from translation-only to full model-root transform (gizmo TRS) and Settings Euler rotation XYZ with clip-scoped persistence matching position.

## Approach

1. **Move gizmo** — use `$transformMode` for mode (no longer force `translate`); keep **world** space; show transform-mode toolbar + W / E / R while Move is active (no bone selection required)
2. **Settings rotation** — extend `$transformReadout` / `TransformReadout` with Euler degrees (order `XYZ`, display wrapped to `[0, 360)`); `applyTransformRotationAxis` mirrors position apply (pause, suspend mixer, dirty as `modelRoot`, sample at t=0 when a clip is active)
3. **Clip metadata** — `ClipEntry.rootRotationByModelId: Record<modelId, [x, y, z]>` degrees; missing key → rest-pose root rotation
4. **Apply** — `applySceneRootTransform(root, position, rotation)` sets position and/or rotation from clip overrides, else restores each from rest pose independently
5. **Save** — model-root + ready clip writes both `rootPositionByModelId` and `rootRotationByModelId`; no-clip path still `refreshRestPoseNode` (full TRS including scale from gizmo)

## Non-goals

No Settings scale UI; no local-space Move gizmo; no persistence of root scale on the clip (scale via Move Save without a clip updates rest pose only).
