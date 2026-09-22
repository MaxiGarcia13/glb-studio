# US-44 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start. **Blocked on US-41**.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start (after US-41)
- [x] **Changelog Open row** — Add US-44 to `specs/CHANGELOG.md` Open
- [ ] **Pick CSG library** — Document choice + license + approx bundle size in design
- [ ] **Pick UX flow** — Dedicated cutter spawn vs multi-select cutter
- [ ] **Carve scope in current** — Soften boolean exclusion for created subtract
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain / adapter

- [ ] **CSG subtract adapter** — World/local matrices; failure mapping; fixture test
- [ ] **Cut action + undo** — Replace target geo, remove cutter, craft flag
- [ ] **Intersection preflight** — AABB / clear errors

## UI

- [ ] **Cut hole entry** — Toolbar / menu; cutter controls; Cut / Cancel
- [ ] **Gates** — Created, selection, not post-Skin

## Verify

- [ ] **Box − cylinder** — Viewport hole + export
- [ ] **Undo / redo cut** — Restores pieces
- [ ] **Failure path** — No intersection → message, no mutation
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
