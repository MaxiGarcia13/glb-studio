# US-46 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start (prefer after US-40 ships or is explicitly combined)
- [x] **Changelog Open row** — Add US-46 to `specs/CHANGELOG.md` Open
- [ ] **Carve scope in current** — Note session undo for albedo maps + skinned Library texture rows; keep prep / PBR / durable undo out
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain — undo

- [ ] **`materialColorMap` command type** — Extend `UndoableCommand` / apply-undoable-command; before/after map snapshots (clone or null); unit tests for apply undo + redo
- [ ] **Safe dispose policy** — Live replace may dispose the previous _live_ map; stack clones survive until the entry is pruned; no black/disposed material after undo
- [ ] **Wire create apply / clear** — US-39 prep Apply + `PartTextureTool` clear push undo; failed decode still pushes nothing
- [ ] **Wire skinned apply / clear** — `SkinnedTextureTool` (and shared replace/clear helpers used by Library) push the same command

## Domain — library data

- [ ] **List textured skinned meshes** — Helper: skinned meshes under a model scene that have a standard-material `.map`; label from `texture.name` / mesh name
- [ ] **Revision bump** — Store signal so Library / chrome re-render after apply, clear, undo, redo

## UI

- [ ] **Library texture rows** — Under each skinned `LibraryModel`, nested row(s) when maps exist; clear control; multi-mesh naming; chevron / `hasNested` updated
- [ ] **Clear from Library** — Same undoable clear as toolbar; no US-39 prep modal
- [ ] **Created path** — No regression on PartTextureTool / prep; created Library chrome unchanged unless a minimal affordance is accepted in kickoff

## Verify

- [ ] **Created: apply → undo → redo → clear → undo** — Map and viewport match; stack order with a pose edit still sane
- [ ] **Skinned: Kenney atlas apply → Library row → clear → undo** — Face/atlas correct after undo; row appears/disappears with revision
- [ ] **Failed pick** — Oversized / bad file: no undo entry; previous map intact
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
