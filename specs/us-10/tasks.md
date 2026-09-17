# US-10 tasks

Do not start until explicitly kicked off. Tick only after acceptance.

## Prep

- [x] List MVP edit operations that must be undoable commands (trim, keyframe write, speed/bake intent, …)
- [x] Decide snapshot vs patch for undo v1 (default: clip snapshot)
- [x] Lock keymap table (Space; R axes; W / E / T transform; arrows / Shift+arrows nudge; Cmd/Ctrl+S save; C / V / Delete create-part; Cmd/Ctrl+Z / Shift+Z undo/redo)
- [ ] Define nudge step size and local vs world space for arrow nudges
- [ ] Document MVP limits: Copy / Paste / Delete apply to **create parts only** (no bone removal, no imported-mesh clipboard, no full-model cut/paste)

## Implement — command catalog & hotkeys

- [ ] Pure command catalog in `editor-shell` (id, chords, label, category) — single source of truth for bindings + docs
- [ ] Shared `isTypingTarget` (or equivalent); ignore shortcuts when focus is in text fields that own them
- [ ] `run-editor-command` dispatcher → existing actions (`play` / `pause`, `saveKeyframe`, `setAxesVisible`, create part duplicate/delete, …)
- [ ] Single `use-editor-command-hotkeys` window listener (replace / absorb `use-transform-mode-hotkeys`)
- [ ] Remap transform modes: **W / E / T** = Move / Rotate / Scale; update toolbar labels from catalog
- [ ] Wire **R** → toggle world axes (`axesVisible`)
- [ ] Wire **Space** → play / pause
- [ ] Wire arrow keys (+ Shift for Z) → nudge selected object on X / Y / Z
- [ ] Wire **Cmd/Ctrl+S** → save pending change (`saveKeyframe` when pose dirty)
- [ ] Wire **Cmd/Ctrl+C / V** → create-part copy / paste (in-session buffer or duplicate path)
- [ ] Wire **Delete** → `deleteSelectedPart` when a create part is selected
- [ ] **Commands** control on `EditorToolbar` opens a modal listing all catalog entries (no second hardcoded list)

## Implement — undo / redo stack

- [ ] Command stack service in `animation` (or `editor-shell`) domain
- [ ] Wrap trim + keyframe mutations as undoable commands
- [ ] Undo / Redo UI + shortcuts via catalog (**Cmd/Ctrl+Z**, **Cmd/Ctrl+Shift+Z** or **Y**)
- [ ] Mixer rebind after stack ops; integrate or replace US-3 pre-trim restore

## Verify

- [ ] All US-10 acceptance criteria in [`requirements.md`](./requirements.md) pass
- [ ] Hotkeys do not fire while typing in inputs / textareas / contenteditable
- [ ] Commands modal matches live bindings from the catalog
