# US-21 — Whole-model rotate / scale + Settings root rotation

Delta for Move-mode TRS and Settings root rotation XYZ. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-15 (Edit / Move + root position).

## Story

As an editor user, when Move is selected I can translate, rotate, and scale the whole model; I can also set model-root rotation XYZ (0–360°) in Settings, with the same Save / Restore and clip-scoped persistence as root position.

## Acceptance

- [x] **Move:** TransformControls support translate / rotate / scale on the active model root (world space); W / E / R and the transform-mode toolbar are available while Move is active; raycast still does not switch selection away from the root
- [x] Settings General shows live editable **rotation X / Y / Z** (degrees, 0–360) and **scale X / Y / Z** for the model root whenever a model is loaded — independent of Edit / Move; values reflect the loaded scene root on import / focus
- [x] Committing a rotation or scale number updates the scene root, marks dirty as a model-root edit, and uses the same Save / Restore path as Move gizmo / position XYZ
- [x] **Save (no active clip):** commits model-root TRS (including rotation / scale) as the rest / bind root
- [x] **Save (active ready/draft clip on that model):** stores root position, rotation, and scale on that clip for that model (`rootPositionByModelId` + `rootRotationByModelId` + `rootScaleByModelId`); seeks to t=0; does not refresh the T-pose rest root
- [x] **Selecting a clip** applies that clip’s stored root position, rotation, and scale for the playing model (or rest root when unset)
- [x] On model load / replace, authored root TRS on single-child GLTF wrappers is hoisted onto `gltf.scene` so Settings rotation / position / scale reflect the loaded orientation

## Out of scope for this delta

- Local-space Move gizmo
- Uniform-only scale lock
