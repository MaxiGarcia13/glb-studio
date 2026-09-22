# US-41 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start
- [x] **Changelog Open row** — Add US-41 to `specs/CHANGELOG.md` Open
- [ ] **Carve scope in current** — Footnote create craft path; clarify boolean fuse remains out until US-44/45 kickoff
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain

- [ ] **Crafted userData + bake / reset** — Flag, bake helper, density policy, size-rebuild gate; unit tests
- [ ] **Clipboard geometry** — Snapshot / instantiate crafted buffers; duplicate / paste tests
- [ ] **Undo craftGeometry** — Command id, before/after apply, Reset pushes undo

## UI

- [ ] **PartInspector crafted state** — Custom mesh label + Reset; size fields hidden when crafted
- [ ] **Skin / imported gates** — Entry points disabled with reason

## Verify

- [ ] **Bake → size no-op → Reset** — Manual + unit
- [ ] **Duplicate / paste / undo** — Verts preserved
- [ ] **Export GLB** — Custom shape visible on re-open in external viewer
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
