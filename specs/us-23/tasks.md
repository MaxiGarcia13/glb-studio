# US-23 — Tasks

**Do not start until explicitly kicked off.** Tick only after the matching acceptance criteria pass.

## Spec / kickoff

- [ ] **Confirm kickoff** — Product owner asks to implement US-23; until then this delta stays open and unchecked
- [ ] **Fold prep note** — On ship: fold requirements into `current/requirements.md`, design seams into `current/design.md`, changelog row, delete this folder

## Domain foundations

- [x] **Add `create` module skeleton** — Create `src/modules/create/` with `domain/` (and types) so kit/part logic stays out of `animation/` and out of ad-hoc UI
- [x] **Define `PartKind` registry** — Register `box`, `sphere`, `cylinder`, `capsule` with `createMesh`, default size params, and a way for the inspector to know which fields to show
- [ ] **Define `Kit` registry + recipes** — Data-only kits: `empty` (no parts), `simple-car` (body + four wheels), `block-figure` (torso, head, arms, legs); metres, Y-up, ground at y = 0
- [ ] **Extend `ModelEntry` with `source`** — `'imported' | 'created'`; imports stay `'imported'`; dispose safely when `blobUrl` is absent for created models

## Store / library

- [ ] **`createModelFromKit(kitId)` action** — Build scene from kit recipe, assign id + default `New model N.glb` name, set `source: 'created'`, append to library, add to `previewModelIds`, set `activeModelId`
- [ ] **Skip skeleton validation for created models** — Keep strict skinned + skeleton checks only on the file load path (`loadModelFromFile`)

## UI — create flow

- [ ] **New model control on Models section** — Place next to Load; opens kit picker (modal)
- [ ] **Kit picker modal** — List Empty / Simple car / Block figure with short beginner copy; Cancel / Create
- [ ] **Beginner hint** — When a created model is focused and nothing is selected, show brief non-blocking hint to select a part and use Edit

## Part editing

- [ ] **Wire Edit Save / Restore for created parts** — Reuse US-15 dirty Save / Restore so part TRS commits to the scene graph (no clip keyframes required)
- [ ] **Part inspector — color** — Selected part: color control updates `MeshStandardMaterial` live
- [ ] **Part inspector — size** — Selected part: kind-specific size fields rebuild geometry without resetting useful TRS / material color
- [ ] **Duplicate selected part** — Clone mesh (geometry/material as appropriate), offset slightly so it is visible, select the clone
- [ ] **Delete selected part** — Remove mesh from the scene; clear selection; do not remove the library model entry

## Export / verify

- [ ] **Export created model** — Confirm Download / zip includes the created scene as a normal `{model}.glb`
- [ ] **Regression — imported models** — Upload a character GLB still requires skinned mesh + skeleton; create path did not weaken import validation
- [ ] **Manual beginner pass** — Create car kit → recolor wheel → move body → duplicate wheel → export → open GLB in an external viewer
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
