# US-24 — Tasks

**Do not start until US-23 is done (or explicitly waived) and this US is kicked off.** Tick only after acceptance.

## Spec / kickoff

- [ ] **Confirm kickoff** — Do not implement while US-23 is still open unless product explicitly combines the work
- [ ] **Fold prep note** — On ship: fold into `current/`, changelog, delete this folder

## Part kinds

- [ ] **Add `plane` PartKind** — Default size useful for floors/panels; inspector fields for width / height; register beside existing kinds
- [ ] **`addPart(modelId, kindId)` domain action** — Instantiates default mesh, assigns unique name, parents under the created model scene, returns the object for selection

## UI

- [ ] **Add-part palette** — Visible only when focused model has `source: 'created'`; one control per kind (or compact select + Add)
- [ ] **Select after add** — New part becomes the raycast / TransformControls selection so beginners can move it immediately
- [ ] **Guard imported models** — Palette not offered (or no-ops with clear reason) when focus is an imported character

## Verify

- [ ] **Build beyond kit** — Empty kit → add box + cylinder → transform → export opens correctly externally
- [ ] **Naming** — Adding two boxes yields distinct overlay names
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
