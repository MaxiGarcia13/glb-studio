# US-21 design

## Scope

Extend US-15 Move / Settings root placement from translation-only to full model-root transform (gizmo TRS) and Settings Euler rotation + scale XYZ with clip-scoped persistence matching position.

## Approach

1. **Move gizmo** — use `$transformMode` for mode (no longer force `translate`); keep **world** space; show transform-mode toolbar + W / E / R while Move is active (no bone selection required)
2. **Settings TRS** — extend `$transformReadout` / `TransformReadout` with Euler degrees (order `XYZ`, display wrapped to `[0, 360)`) and scale XYZ (min `0.001`); apply helpers mirror position (pause, suspend mixer, dirty as `modelRoot`, sample at t=0 when a clip is active)
3. **Clip metadata** — `rootPositionByModelId`, `rootRotationByModelId` (degrees), `rootScaleByModelId`; missing key → rest-pose channel
4. **Apply** — `applySceneRootTransform(root, position, rotation, scale)` sets each channel from clip overrides, else restores from rest pose independently
5. **Save** — model-root + ready clip writes all three maps; no-clip path still `refreshRestPoseNode` (full TRS)
6. **Load hoist** — after GLTF parse, `hoistRootTransform(gltf.scene)` promotes single-child wrapper TRS onto the scene root so Settings / Move read the authored orientation

## Non-goals

No local-space Move gizmo; no uniform-only scale lock.
