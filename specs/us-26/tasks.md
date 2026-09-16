# US-26 — Tasks

**Do not start until explicitly kicked off** (after US-23). Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Do not implement until asked
- [ ] **Fold prep note** — On ship: fold into `current/`, changelog, delete this folder

## Hierarchy

- [x] **`parentPart(child, parent)` helper** — Reparent with world-transform preservation; allow parent = parts root
- [x] **Unparent control** — Move selected part back under the parts root without jumping in world space
- [x] **Parent picker UI** — Choose target parent from other parts on the same created model (exclude self / descendants to avoid cycles)

## Outliner

- [x] **Part list for focused created model** — Show mesh names; indent optional if hierarchy depth > 1
- [x] **Click to select** — Integrates with existing selection + TransformControls + inspector
- [x] **Keep list in sync** — Refresh on add / duplicate / delete / parent changes

## Verify

- [ ] **Car body + wheels** — Parent wheels to body; moving body moves wheels; export retains hierarchy
- [ ] **Cycle guard** — Cannot parent a part under its own descendant
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
