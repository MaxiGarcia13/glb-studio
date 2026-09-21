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
