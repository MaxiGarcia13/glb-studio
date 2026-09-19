# US-33 — Tasks

Prefer completing this before US-34. Tick only after acceptance.

## Spec / kickoff

- [x] **Lock product choices** — Replace (skinned Block robot only); offline script → `public/kits/`; T-pose only — see [`requirements.md`](./requirements.md) Locked product choices
- [x] **Bone / clip contract note** — [`public/kits/README.md`](../../public/kits/README.md); design links to it

## Asset

- [x] **Generate skinned Block robot GLB** — Offline script from create-group recipe; humanoid bind pose; bones; at least one skinned mesh; no embedded demo clips (`npm run kits:block-robot`)
- [x] **Place asset in repo** — `public/kits/block-robot.glb` → `/kits/block-robot.glb`
- [x] **Manual inspect** — 17 bones (contract names), 22 skinned meshes, 0 animations; no root-motion clips

## Kit registry + spawn

- [x] **Extend `Kit` type** — Discriminated `MeshKit` vs `SkinnedKit`; type-safe `KitId`
- [x] **Register skinned Block robot** — Label + description in From kit list (“Block robot”)
- [x] **`createFromKit` skinned branch** — Fetch/parse GLB → `importModelResults` (imported); no create-parts revision bump
- [x] **Error path** — Failed load shows clear copy in From kit modal; library unchanged

## Mesh kit disposition

- [x] **Remove mesh Block robot from From kit** — Recipe kept as maintainer-only `BLOCK_ROBOT_MESH_RECIPE`; Modern house + empty as-is

## Verify

- [ ] **From kit → skinned robot** — SkeletonHelper visible; bone outliner; select bone; Edit gizmo
- [ ] **Clip path** — Import a matching clip / retarget still works (kit has no embedded demos)
- [ ] **Export zip** — Model GLB re-imports as skinned character
- [ ] **New model / house kit** — Unaffected
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)

## Ship

- [ ] Fold into `specs/current/`; CHANGELOG **US-33**; delete `specs/us-33/`
