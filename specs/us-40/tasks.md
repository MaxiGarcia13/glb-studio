# US-40 — Tasks

Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Explicit start
- [x] **Changelog Open row** — Add US-40 to `specs/CHANGELOG.md` Open
- [x] **Carve scope in current** — Soften / footnote “imported character materials” out-of-scope to allow albedo-only on skinned library models
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain

- [x] **Resolve skinned texture target** — Selected SkinnedMesh or sole skinned mesh; unit tests
- [x] **Shared apply / clear** — Reuse or lift US-28 map helpers so create + skinned share dispose / alpha sync

## UI

- [x] **Skinned texture control** — Apply / replace / clear when skinned focus + valid target; disabled reason otherwise
- [x] **Create path untouched** — PartTextureTool / US-39 still created-only

## Verify

- [ ] **Import Kenney FBX + Skins PNG** — Apply atlas, viewport + export GLB, clear
- [ ] **Block robot / Skin model** — Same apply / clear works
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
