# US-10 design

## Scope

1. In-memory **undo/redo** command stack for clip-mutating editor operations.
2. Shared **editor command catalog** + hotkey dispatcher + **Commands** modal (docs from the same catalog).

## Command catalog & hotkeys

### Placement

- Pure catalog: `editor-shell` (e.g. `domain/editor-commands.ts`) — `{ id, chords, label, category }` only; no store writes.
- Dispatcher: `run-editor-command(id)` maps ids to existing module actions (`animation` playback / `saveKeyframe`, `viewport` transform mode / axes, `create` part duplicate/delete, undo stack ops).
- Listener: one `use-editor-command-hotkeys` hook (absorbs / replaces `use-transform-mode-hotkeys`).
- Docs UI: `CommandsModal` opened from a **Commands** control on `EditorToolbar`; body rendered from the catalog.

### Keymap (locked)

| Chord                   | Command                                              |
| ----------------------- | ---------------------------------------------------- |
| Space                   | Play / pause                                         |
| R                       | Toggle world axes                                    |
| W / E / T               | Transform mode: Move / Rotate / Scale                |
| ← / →                   | Nudge −X / +X                                        |
| ↑ / ↓                   | Nudge +Y / −Y                                        |
| Shift+↑ / Shift+↓       | Nudge +Z / −Z                                        |
| Cmd/Ctrl+S              | Save pending change (`saveKeyframe` when pose dirty) |
| Cmd/Ctrl+C              | Copy create part (in-session buffer)                 |
| Cmd/Ctrl+V              | Paste create part from buffer                        |
| Delete                  | Delete selected create part                          |
| Cmd/Ctrl+Z              | Undo                                                 |
| Cmd/Ctrl+Shift+Z (or Y) | Redo                                                 |

### Nudge (prep decision)

Default proposal until prep locks otherwise: world-space position step of **0.1** (metres) on the selected object (Edit selection or Move root when applicable); ignore when nothing movable is selected. Document final step / space in this section when prep completes.

### Create-part clipboard (MVP)

- Copy / Paste / Delete target **stamped create parts** only.
- In-session buffer (not system clipboard required for v1); paste no-ops if empty; Delete no-ops if no create part selected.
- No bone removal; no imported-mesh clipboard; no full-model cut/paste.

### Focus rules

Ignore chords when `isTypingTarget` (input / textarea / select / contenteditable), except where a control explicitly handles its own keys. Prevent default for app-owned chords (e.g. Cmd+S) so the browser does not intercept.

## Undo / redo stack

### MVP undoable command set (locked)

Acceptance requires at least trim, keyframe write, and speed/bake intent. Exact set for US-10 v1:

| Command id (stack) | User action | Mutates | Notes |
| --- | --- | --- | --- |
| `trimClip` | Apply trim start/end (`trimClip`) | Working `clip`, `trimStart` / `trimEnd`, `duration` | Always derived from `sourceClip`; undo restores prior working clip + trim window. Replaces one-shot “restore pre-trim” as the recoverability path once the stack exists (US-3 still satisfied via undo or re-trim from `sourceClip`). |
| `saveKeyframe` | Save pending pose (`saveKeyframe`, including hold-to-end) | Working `clip` (and `sourceClip` / bind-pose overrides when that path rebases) | One discrete stack entry per Save click / Cmd+S that actually commits. Covers upsert and hold-window key removal inside the write. **No standalone “delete keyframe” UI today** — when one lands, it joins this set as its own command. |
| `setTimeScale` | Change clip speed (`setTimeScale`) | `ClipEntry.timeScale` | Stored bake intent: export runs `bakeTimeScale(clip, timeScale)`. Undo restores prior scale + mixer `timeScale`. |

**One stack entry = one user commit** (not every intermediate slider tick while dragging — coalesce pointer-up / blur / explicit Apply if the control is continuous).

### Explicitly not undoable in US-10 v1

| Operation | Why |
| --- | --- |
| Play / pause / stop / loop / scrub | Transport / view state; no clip mutation |
| Unsaved gizmo / Settings pose (`restorePose`) | Ephemeral until Save; discard is not an undo step |
| Transform mode, axes, selection, nudge | Viewport chrome / live TRS; nudge does not commit a clip |
| Create-part spawn / duplicate / delete / clipboard | Scene graph edits; hotkeys ship in this US, undo deferred |
| `bakeBlend`, retarget, rename, replace/import clip, draft create | Out of scope or larger library ops; blend/retarget only get undo when those features opt in later |

### Approach

- Command pattern: each edit pushes `{ undo, redo }` (or snapshot before/after of the working clip)
- Prefer clip-level snapshots for correctness early; optimize to patch diffs later if needed
- After undo/redo: replace library working clip reference and rebind mixer action; clear selection if node missing
- Keyboard undo/redo go through the catalog (same focus rules as other shortcuts)

### Relation to US-3

- Migrate “restore pre-trim” to an undoable `trimClip` command on the stack (re-trim from `sourceClip` remains valid without using undo)

### Non-goals

No durable undo log across reloads in this story.

## Current contract touchpoints

On ship into `current/`: replace documented **W / E / R** transform hotkeys with **W / E / T**, note **R** = axes, and fold Commands modal + keymap into editor chrome / design sections.
