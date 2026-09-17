# US-10 — Undo / redo + editor commands

Delta for a session undo/redo stack covering animation edits beyond pre-trim restore, plus a shared editor command catalog (hotkeys + Commands modal). Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-3 / US-4 (and later US-8 / US-9 when present). Post-MVP.

## Story

As an editor user, I can undo and redo animation edits within the session, and I can use documented keyboard commands (playback, transform modes, axes, bones, nudge, save, create-part clipboard, undo/redo) without hunting through the UI.

## Acceptance — undo / redo

- [ ] Undo / Redo controls (and standard shortcuts) reverse and reapply discrete edit commands
- [ ] Covered operations include at least: trim apply, keyframe save/update/delete, and speed changes that mutate exported bake intent if stored on the clip — document exact command set in design
- [ ] Stack is per-session (not persisted to disk unless explicitly added later)
- [ ] Pre-trim “restore” from US-3 either becomes a command on the stack or is superseded by undo without breaking acceptance of US-3
- [ ] Undoing does not leave the mixer bound to a disposed/stale clip

## Acceptance — hotkeys & Commands UI

- [ ] A pure command catalog is the single source of truth for chords, labels, and categories (hotkeys + docs share it — no second hardcoded list)
- [ ] Shortcuts do not fire when focus is in an input, textarea, select, or contenteditable that owns typing
- [ ] Transform modes: **Q** Move, **W** Rotate, **E** Scale (replaces previous W / E / R); toolbar labels match the catalog
- [ ] **R** toggles world axes visibility
- [ ] **B** toggles skeleton bone lines visibility (`bonesVisible`)
- [ ] **Space** toggles play / pause when a clip can play
- [ ] Arrow keys nudge the current selection on **X** (left/right) and **Y** (down/up); **Shift+↑ / Shift+↓** nudge on **Z** — step and space documented in design
- [ ] **Cmd/Ctrl+S** commits a still-dirty pose (`commitPendingPose` / `saveKeyframe`); no-op when nothing to save. Pose edits normally auto-commit on gesture end (gizmo drag-end, nudge, Settings blur) so Save is not required.
- [ ] **Cmd/Ctrl+C / V** and **Delete** operate on **create parts only** (in-session buffer or duplicate path; `deleteSelectedPart` when a create part is selected)
- [ ] `EditorToolbar` exposes a **Commands** control that opens a modal listing all catalog entries with their chords
- [ ] Undo / redo shortcuts are catalog entries: **Cmd/Ctrl+Z**, **Cmd/Ctrl+Shift+Z** (or **Y**)

## Out of scope for this delta

- Cross-document / cross-file history
- Collaborative OT/CRDT
- Durable undo log across reloads
- Retarget / blend / morph / curve features themselves (only undo integration when those exist)
- Bone removal on imported / skinned rigs
- Clipboard for imported meshes or full-model cut / paste
- Changing browser-reserved shortcuts beyond preventDefault where the app owns the action (e.g. Cmd+S save change, not OS save-page)
