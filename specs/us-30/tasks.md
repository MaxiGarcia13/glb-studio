# US-30 — Tasks

**Do not start until explicitly kicked off.** Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Explicit go-ahead before coding
- [ ] **Fold prep note** — On ship: update `current/` (library header actions, Settings aside, floating chrome), changelog Shipped row, delete this folder

## Toolbar shell

- [x] **EditorToolbar shell** — Full-width Blender-style menu bar above asides; File `ActionMenu` + Settings `ActionMenuPanel`; outside preview
- [x] **File: New model** — Wire `createEmptyModel`; remove Models header `+`
- [x] **File: New animation** — Shared draft via `startNewAnimation`; disable without focused scene; remove Shared header `+`
- [x] **File: Export** — Opens `ExportModal`; respect `canExport`; remove Settings aside Download
- [x] **Settings: axes** — Show world axes + Axes Length (m); remove aside Axes block

## Smart Import

- [x] **Content router** — Per file: skinned+skeleton → model; animations-only → shared; else error; batch continues
- [x] **Remove dual Import buttons** — Drop Models “Load models” and Shared “Import animations”
- [x] **Keep model Add animation** — Modal Create / Import / Add existing still owned-scoped

## Verify

- [ ] **Empty session** — New model works; New animation disabled; Import animation-only → Shared; Export disabled until something exists
- [ ] **Model GLB with clips** — Lands in Models with owned embedded clips (not Shared)
- [ ] **Export** — Modal opens; pack unchanged vs US-22
- [ ] **Axes** — Toggle / length still drive viewport; gone from Settings aside
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
