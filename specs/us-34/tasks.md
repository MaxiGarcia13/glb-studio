# US-34 — Tasks

**Kicked off.** Product choices locked in [`requirements.md`](./requirements.md). Tick only after acceptance.

## Spec / kickoff

- [x] **Lock product choices** — Entry: model ⋯; after-skin: freeze; no-groups: disable; `source` → `imported`; clips: drop mesh tracks ([`requirements.md`](./requirements.md))
- [x] **Confirm MVP = rigid weights only** — No paint UI in this US

## Domain: detect + convert

- [x] **`canSkinModel(model)`** — Prerequisites + disabled reason string
- [x] **`buildBonesFromCreateGroups(scene)`** — Name-stable Bone tree matching group hierarchy
- [x] **`bindMeshesRigid(scene, skeleton)`** — Per-part SkinnedMesh (or equivalent) with weight 1 to parent bone; bind matrices correct at rest
- [x] **`skinCreatedModel(modelId)` action** — Clone → convert → swap on success; restore original on failure; user-visible error

## Library / viewport gates

- [x] **`isSkinnedLibraryModel`** — Shared predicate for SkeletonHelper + BoneOutliner (`source === 'imported'` with usable skeleton)
- [x] **Part tools after skin** — Hide create toolbar / part outliner (follows `source → imported`); do not leave broken part-edit paths

## UI

- [x] **Skin model control** — Library model ⋯ item; wired to `canSkinModel`; busy/disabled states
- [x] **Copy** — Success silent or one-line; failures explicit
- [x] **Make joint / Unjoint** — Part context menu alongside Group / Ungroup; joint `userData` kind; Skin bones from joints only; name picker on Make joint; model Group/Ungroup unchanged
- [x] **Easy Make joint** — Connection pivot (upper/lower extremes); all selected parts under joint; plain modal copy; unit tests
- [x] **Make joint name default** — Suggest from selection names; no forced Hips; unit tests
- [x] **Connector picker modal** — Preview selection; New connector vs pick one item; group from choice; UI “connector” copy; unit tests
- [x] **Multi-connector wizard** — Checkbox mark 1+; label step; nearest parenting; unit tests
- [x] **Connector naming UX** — Custom name first; bend-point copy; optional Humanoid/Quad presets; unit tests
- [x] **Build a chain** — Auto hinges from sphere-like parts; nested connectors; modal mode; unit tests _(removed — manual mark only)_
- [x] **Skip label step** — One-step Connect with auto-names from parts (Skin does not need Mixamo labels)
- [x] **Manual-only Make connector** — Drop Build a chain; mark bend points → Connect
- [x] **Nest marked bend points** — 2+ marks nest proximal→distal along selection axis; interval parenting; unit tests
- [x] **Branching Connect tree** — Shared proximal hinge → both limbs (hips→knees→ankles); same-depth siblings; unit tests

## Clips / export

- [x] **Owned clip policy** — Drop mesh / create-part object tracks for that model after skin
- [x] **Export + re-import** — Skinned GLB round-trips as skinned imported model with bones

## Verify

- [ ] **Mesh Block robot (if available) → Skin** — Helper visible; bone outliner; select Hips/Hand; Edit rotate
- [ ] **Empty / house** — Skin disabled with clear reason
- [ ] **Failure injection** — Corrupt intermediate does not wipe library model
- [ ] **Export zip** — External viewer / re-import shows skeleton
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)

## Ship

- [ ] Fold into `specs/current/`; revise out-of-scope skinning bullet; CHANGELOG **US-34**; delete `specs/us-34/`
