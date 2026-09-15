# US-23 — Tasks

Tick only after the matching acceptance criteria pass.

## Spec / kickoff

- [x] **Confirm kickoff** — Create flow started; New model → empty shipped in code
- [ ] **Fold prep note** — On ship: fold requirements into `current/requirements.md`, design seams into `current/design.md`, changelog row, delete this folder

## Domain foundations

- [x] **Add `create` module skeleton** — `src/modules/create/` with `domain/` (and types)
- [x] **Define `PartKind` registry** — `box`, `sphere`, `cylinder`, `capsule`
- [x] **Kit registry seam** — Keep `Kit` types / empty entry for US-27; New model does not open a picker
- [x] **Extend `ModelEntry` with `source`** — `'imported' | 'created'`; dispose safely when `blobUrl` is absent

## Store / library

- [x] **`createEmptyModel()` action** — Blank scene, `New model N.glb`, `source: 'created'`, preview + focus
- [x] **Skip skeleton validation for created models** — Strict checks only on file load

## UI — create flow

- [x] **New model control** — Plus next to Load; creates empty model immediately (no modal)
- [x] **Beginner hint** — When a created model is focused and nothing is selected, short hint to add / select a part and use Edit

## Part editing

- [x] **Wire Edit Save / Restore for created parts** — Reuse US-15 dirty Save / Restore
- [x] **Create toolbar — color** — Vertical rail after Settings; live `MeshStandardMaterial` color via color tool
- [x] **Part inspector — size** — Kind-specific size fields rebuild geometry
- [x] **Duplicate selected part** — Clone + slight offset + select clone (toolbar)
- [x] **Delete selected part** — Remove mesh; clear selection; keep library entry (toolbar)

## Export / verify

- [x] **Export created model** — Zip includes created scene as `{model}.glb`
- [ ] **Regression — imported models** — Upload still requires skinned mesh + skeleton
- [ ] **Manual beginner pass** — New empty model → add/edit parts → export → open externally
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
