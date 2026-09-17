# US-33 — Tasks

**Do not start until explicitly kicked off.** Prefer completing this before US-34. Tick only after acceptance.

## Spec / kickoff

- [ ] **Lock product choices** — Replace vs dual Block robot kits; asset source; whether demo clips ship in the GLB ([`requirements.md`](./requirements.md) Open product choice)
- [ ] **Bone / clip contract note** — Short doc in design or `public/kits/README` (names, license, expected skeleton)

## Asset

- [ ] **Author or generate skinned Block robot GLB** — Humanoid bind pose; bones; at least one skinned mesh; optional 1–2 demo clips
- [ ] **Place asset in repo** — Stable URL for the kit loader (`public/kits/…` or bundled import)
- [ ] **Manual inspect** — Confirm clips, bone names, no unexpected root motion (per AGENTS hard constraints)

## Kit registry + spawn

- [ ] **Extend `Kit` type** — Discriminated mesh recipe vs `skinnedAsset`; type-safe `KitId`
- [ ] **Register skinned Block robot** — Label + description in From kit list
- [ ] **`createFromKit` skinned branch** — Parse GLB → imported library entry + owned embedded clips; no create-parts revision bump required
- [ ] **Error path** — Failed load surfaces clear copy; library unchanged

## Mesh kit disposition

- [ ] **Apply kickoff choice** — Remove or rename previous create-group Block robot; keep Modern house + empty as-is

## Verify

- [ ] **From kit → skinned robot** — SkeletonHelper visible; bone outliner; select bone; Edit gizmo
- [ ] **Clip playback** — If kit embeds clips, select and play; else import a matching clip / retarget path still works
- [ ] **Export zip** — Model GLB re-imports as skinned character
- [ ] **New model / house kit** — Unaffected
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)

## Ship

- [ ] Fold into `specs/current/`; CHANGELOG **US-33**; delete `specs/us-33/`
