# US-45 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start. **Blocked on US-41**. Prefer shared CSG adapter with US-44.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start (after US-41; coordinate with US-44 for one CSG library)
- [x] **Changelog Open row** — Add US-45 to `specs/CHANGELOG.md` Open
- [ ] **Decide Reset policy** — Primary kind reset vs disable Reset on fused
- [ ] **Carve scope in current** — Soften boolean exclusion for created union; note Fuse vs Group
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain / adapter

- [ ] **CSG union adapter** — Multi-operand; matrix bake; fixture test
- [ ] **Fuse action + undo** — Primary survives, others removed, crafted flag
- [ ] **Material / name policy** — Documented + tested

## UI

- [ ] **Fuse control** — Enabled at ≥2 parts; helper copy for arm/segment workflow
- [ ] **Gates** — Created, not post-Skin

## Verify

- [ ] **Two boxes → one mesh** — Visual continuity + export
- [ ] **Undo fuse** — Restores both parts
- [ ] **Segment + joint workflow** — Manual: fuse upper, fuse lower, joint, pose
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
