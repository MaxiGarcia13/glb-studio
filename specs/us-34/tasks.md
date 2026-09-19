# US-34 — Tasks

**Do not start until explicitly kicked off.** US-33 skinned kit is shipped for visual QA. Tick only after acceptance.

## Spec / kickoff

- [ ] **Lock product choices** — Entry point; after-skin part editing; no-groups behavior; `source` strategy; clip migration ([`requirements.md`](./requirements.md))
- [ ] **Confirm MVP = rigid weights only** — No paint UI in this US

## Domain: detect + convert

- [ ] **`canSkinModel(model)`** — Prerequisites + disabled reason string
- [ ] **`buildBonesFromCreateGroups(scene)`** — Name-stable Bone tree matching group hierarchy
- [ ] **`bindMeshesRigid(scene, skeleton)`** — Per-part SkinnedMesh (or equivalent) with weight 1 to parent bone; bind matrices correct at rest
- [ ] **`skinCreatedModel(modelId)` action** — Clone → convert → swap on success; restore original on failure; user-visible error

## Library / viewport gates

- [ ] **`isSkinnedLibraryModel`** — Shared predicate for SkeletonHelper + BoneOutliner (imported **or** skinned-created)
- [ ] **Part tools after skin** — Per kickoff: hide create toolbar / part outliner or keep read-only; do not leave broken part-edit paths

## UI

- [ ] **Skin model control** — Wired to availability helper; busy/disabled states
- [ ] **Copy** — Success silent or one-line; failures explicit

## Clips / export

- [ ] **Owned clip policy** — Implement kickoff choice (likely clear incompatible mesh tracks)
- [ ] **Export + re-import** — Skinned GLB round-trips as skinned imported model with bones

## Verify

- [ ] **Mesh Block robot (if available) → Skin** — Helper visible; bone outliner; select Hips/Hand; Edit rotate
- [ ] **Empty / house** — Skin disabled with clear reason
- [ ] **Failure injection** — Corrupt intermediate does not wipe library model
- [ ] **Export zip** — External viewer / re-import shows skeleton
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)

## Ship

- [ ] Fold into `specs/current/`; revise out-of-scope skinning bullet; CHANGELOG **US-34**; delete `specs/us-34/`
