# US-10 tasks

Do not start until explicitly kicked off. Tick only after acceptance.

## Prep

- [x] List MVP edit operations that must be undoable commands (trim, keyframe write, speed/bake intent, …)
- [x] Decide snapshot vs patch for undo v1 (default: clip snapshot)
- [x] Lock keymap table (Space; R axes; B bones; Q / W / E transform; arrows / Shift+arrows nudge; Cmd/Ctrl+S save; C / V / Delete create-part; Cmd/Ctrl+Z / Shift+Z undo/redo)
- [x] Define nudge step size and local vs world space for arrow nudges
- [x] Document MVP limits: Copy / Paste / Delete apply to **create parts only** (no bone removal, no imported-mesh clipboard, no full-model cut/paste)

## Implement — command catalog & hotkeys

- [x] Pure command catalog in `commands` (id, chords, label, category) — single source of truth for bindings + docs
- [x] Shared `isTypingTarget` (or equivalent); ignore shortcuts when focus is in text fields that own them
- [x] `run-editor-command` dispatcher → existing actions (`play` / `pause`, `saveKeyframe`, `setAxesVisible`, create part duplicate/delete, …)
- [x] Single `use-editor-command-hotkeys` window listener in `commands` (replace / absorb `use-transform-mode-hotkeys`)
- [x] Remap transform modes: **Q / W / E** = Move / Rotate / Scale; update toolbar labels from catalog
- [x] Wire **R** → toggle world axes (`axesVisible`)
- [x] Wire **B** → toggle bones (`bonesVisible`)
- [x] Wire **Space** → play / pause
- [x] Wire arrow keys (+ Shift for Z) → nudge selected object on X / Y / Z
- [x] Wire **Cmd/Ctrl+S** → save pending change (`saveKeyframe` when pose dirty)
- [x] Wire **Cmd/Ctrl+C / V** → create-part copy / paste (in-session buffer or duplicate path)
- [x] Wire **Delete** → `deleteSelectedPart` when a create part is selected
- [x] **Commands** control on `EditorToolbar` opens a modal listing all catalog entries (no second hardcoded list)

## Implement — undo / redo stack

- [x] Command stack service in `animation` (or `commands`) domain
- [ ] Wrap trim + keyframe mutations as undoable commands
- [ ] Undo / Redo UI + shortcuts via catalog (**Cmd/Ctrl+Z**, **Cmd/Ctrl+Shift+Z** or **Y**)
- [ ] Mixer rebind after stack ops; integrate or replace US-3 pre-trim restore

## Verify

- [ ] All US-10 acceptance criteria in [`requirements.md`](./requirements.md) pass
- [ ] Hotkeys do not fire while typing in inputs / textareas / contenteditable
- [ ] Commands modal matches live bindings from the catalog
