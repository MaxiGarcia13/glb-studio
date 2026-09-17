# US-27 — Tasks

**Do not start until explicitly kicked off** (after US-23). Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Content-only US; still wait for explicit start
- [ ] **Fold prep note** — On ship: fold kit list into `current/` design if needed, changelog, delete this folder

## Kits

- [x] **Author Simple building recipe** — Modern two-storey gable house (`simple-building` id, label Modern house): foundation, main + wing masses, pitched roofs, windows, porch, balconies; metres, grounded, named parts + groups
- [x] **Author Block robot recipe** — Readable block humanoid/robot from existing kinds; named parts for overlay
- [x] **Register kits + From kit UI** — Secondary entry (not Plus); labels + one-line help
- [ ] **Optional clothed block variant** — If desired, add a kit with separate shirt/pants meshes and distinct colors (still no image textures)
- [ ] **Joint select on pick** — On created models with armature groups, Edit raycast prefers the nearest parent create-group (joint) so rotating the knee area poses the whole limb; Shift+click or an explicit bypass can still target the mesh

## Verify

- [ ] **Create each new kit** — Appears in library, editable, exports
- [ ] **Joint pick smoke** — Click knee/shin in Edit selects `LeftLeg` (or nearest joint group); limb children move together; mesh-target bypass still works
- [ ] **No engine fork** — Diff is mostly recipe/registry files (+ small raycast selection tweak for joints)
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
