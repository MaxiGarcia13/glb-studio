# US-25 — Tasks

**Do not start until explicitly kicked off** (after US-23). Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Leave unchecked until product asks to implement snap
- [ ] **Fold prep note** — On ship: fold into `current/`, changelog, delete this folder

## Settings

- [x] **Snap state on settings store** — `snapToGrid`, `gridStepMetres`, `snapRotation`, `rotationStepDegrees` with documented defaults; session-only
- [ ] **Settings UI** — Controls in General or Create section; labelled for keyboard / a11y (NFR-4)

## Transform integration

- [ ] **Quantize on edit** — When snap is enabled and focused model is created, round translation / rotation during gizmo edit or on Save (pick one path in implementation and stick to it — prefer live gizmo feel)
- [ ] **Scope to created models** — Imported character Edit poses ignore snap (or document exception if global — default is created-only)
- [ ] **Move tool root** — Whole-model Move on a created model respects the same snap flags

## Verify

- [ ] **Align car wheels** — With 0.1 m snap, wheels share an XZ line without fighting the gizmo
- [ ] **Rotation steps** — 45° snap yields orthographic-friendly turns
- [ ] **Toggle off** — Freehand placement still works
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
