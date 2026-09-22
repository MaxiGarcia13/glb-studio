# US-38 — Tasks

**Do not start until explicitly kicked off.** Tick only after acceptance.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit go-ahead before code
- [ ] **Fold prep note** — On ship: fold acceptance into `current/` (US-24 Add-part section + create toolbar design), changelog row, delete this folder

## MRU domain + storage

- [ ] **Default suggestion order** — Constant: box, sphere, capsule, dodecahedron, cone
- [ ] **Resolve compact menu kinds** — Pure helper: MRU + defaults → five unique ids
- [ ] **Record recent kind** — Prepend, dedupe, truncate to five; persist via localStorage util
- [ ] **Load recent kinds** — Read/parse on mount; ignore invalid entries; empty → cold start
- [ ] **Unit tests** — Cold start, pad with defaults, promote existing, truncate, invalid storage

## Compact menu UI

- [ ] **AddPartPalette → five + See more** — Replace flat full-kind list; created-model gate unchanged
- [ ] **Select from compact row** — `addPart` + record recent; menu updates on next open

## See more modal

- [ ] **Browse modal shell** — Opens from See more; lists all kinds grouped Solids / Planar / Polyhedra
- [ ] **Pick from modal** — `addPart` + record recent + close
- [ ] **Small 3D preview** — Shows focused/hovered kind default mesh; dispose on change/unmount

## Verify

- [ ] **Cold start → MRU flow** — Match requirement examples (another → another else → re-add box)
- [ ] **Reload restores MRU** — localStorage survives refresh
- [ ] **Imported focus** — No Add-part menu / modal when focused model is imported
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
