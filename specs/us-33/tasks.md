# US-33 — Tasks

Prefer completing this before US-34. Tick only after acceptance.

## Spec / kickoff

- [x] **Lock product choices** — Dual kits; offline script → `public/kits/`; T-pose only (no demo clips) — see [`requirements.md`](./requirements.md) Locked product choices
- [x] **Bone / clip contract note** — [`public/kits/README.md`](../../public/kits/README.md); design links to it

## Asset

- [x] **Generate skinned Block robot GLB** — Offline script from create-group recipe; humanoid bind pose; bones; at least one skinned mesh; no embedded demo clips (`npm run kits:block-robot`)
- [x] **Place asset in repo** — `public/kits/block-robot.glb` → `/kits/block-robot.glb`
- [x] **Manual inspect** — 17 bones (contract names), 22 skinned meshes, 0 animations; no root-motion clips

## Kit registry + spawn

- [ ] **Extend `Kit` type** — Discriminated mesh recipe vs `skinnedAsset`; type-safe `KitId`
- [ ] **Register skinned Block robot** — Label + description in From kit list (primary “Block robot”)
- [ ] **`createFromKit` skinned branch** — Parse GLB → imported library entry + owned embedded clips (none expected); no create-parts revision bump required
- [ ] **Error path** — Failed load surfaces clear copy; library unchanged

## Mesh kit disposition

- [ ] **Rename mesh Block robot** — Label **Block robot (parts)**; keep recipe; Modern house + empty as-is

## Verify

- [ ] **From kit → skinned robot** — SkeletonHelper visible; bone outliner; select bone; Edit gizmo
- [ ] **Clip path** — Import a matching clip / retarget still works (kit has no embedded demos)
- [ ] **Export zip** — Model GLB re-imports as skinned character
- [ ] **New model / house / parts kit** — Unaffected (parts kit still spawns create-group robot)
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)

## Ship

- [ ] Fold into `specs/current/`; CHANGELOG **US-33**; delete `specs/us-33/`
