# US-42 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start. **Blocked on US-41** unless kickoff explicitly combines them.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start (after or with US-41)
- [x] **Changelog Open row** — Add US-42 to `specs/CHANGELOG.md` Open
- [ ] **Carve scope in current** — Add Brush tool to create craft section when folding
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain

- [ ] **Brush kernels** — Push/Pull, Smooth, Inflate; unit tests on fixture geo
- [ ] **Stroke session + undo** — before/after via US-41 craftGeometry
- [ ] **Bake-on-enter** — Wire US-41 bake; density failure UX

## UI / viewport

- [ ] **Brush tool mode** — Toolbar entry, hotkey, TransformControls/orbit conflict
- [ ] **Radius / strength / brush type** — Controls + invert modifier
- [ ] **Gates** — Created + selection + not post-Skin

## Verify

- [ ] **Sphere Push → Smooth → export** — Shape holds in viewer
- [ ] **Undo stroke** — Restores pre-stroke verts
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
