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

Single source of truth for the catalog. **Cmd** = meta on macOS; **Ctrl** elsewhere. Letter keys are case-insensitive. Remap from today’s **W / E / R** (scale): **T** = Scale, **R** = axes.

| Command id         | Chord(s)                     | Label               | Category  |
| ------------------ | ---------------------------- | ------------------- | --------- |
| `playPause`        | Space                        | Play / Pause        | Playback  |
| `toggleAxes`       | R                            | Toggle world axes   | Viewport  |
| `transformMove`    | W                            | Move                | Transform |
| `transformRotate`  | E                            | Rotate              | Transform |
| `transformScale`   | T                            | Scale               | Transform |
| `nudgeNegX`        | ←                            | Nudge −X            | Transform |
| `nudgePosX`        | →                            | Nudge +X            | Transform |
| `nudgePosY`        | ↑                            | Nudge +Y            | Transform |
| `nudgeNegY`        | ↓                            | Nudge −Y            | Transform |
| `nudgePosZ`        | Shift+↑                      | Nudge +Z            | Transform |
| `nudgeNegZ`        | Shift+↓                      | Nudge −Z            | Transform |
| `savePending`      | Cmd/Ctrl+S                   | Save pending change | Animation |
| `copyCreatePart`   | Cmd/Ctrl+C                   | Copy create part    | Create    |
| `pasteCreatePart`  | Cmd/Ctrl+V                   | Paste create part   | Create    |
| `deleteCreatePart` | Delete                       | Delete create part  | Create    |
| `undo`             | Cmd/Ctrl+Z                   | Undo                | History   |
| `redo`             | Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y | Redo                | History   |

**Redo:** both chords are first-class (mac-style Shift+Z and Windows-style Y). Catalog lists both; listener accepts either.

**Not bound in v1:** bare C / V without modifiers; Backspace as Delete alias; browser Cut (Cmd/Ctrl+X).

**Modifier rule:** letter chords without Cmd/Ctrl/Alt ignore the event when any of those modifiers is held (except the explicit Cmd/Ctrl rows above). Nudge Shift only applies to ↑ / ↓ for Z.

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

| Command id (stack) | User action                                               | Mutates                                                                        | Notes                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trimClip`         | Apply trim start/end (`trimClip`)                         | Working `clip`, `trimStart` / `trimEnd`, `duration`                            | Always derived from `sourceClip`; undo restores prior working clip + trim window. Replaces one-shot “restore pre-trim” as the recoverability path once the stack exists (US-3 still satisfied via undo or re-trim from `sourceClip`).   |
| `saveKeyframe`     | Save pending pose (`saveKeyframe`, including hold-to-end) | Working `clip` (and `sourceClip` / bind-pose overrides when that path rebases) | One discrete stack entry per Save click / Cmd+S that actually commits. Covers upsert and hold-window key removal inside the write. **No standalone “delete keyframe” UI today** — when one lands, it joins this set as its own command. |
| `setTimeScale`     | Change clip speed (`setTimeScale`)                        | `ClipEntry.timeScale`                                                          | Stored bake intent: export runs `bakeTimeScale(clip, timeScale)`. Undo restores prior scale + mixer `timeScale`.                                                                                                                        |

**One stack entry = one user commit** (not every intermediate slider tick while dragging — coalesce pointer-up / blur / explicit Apply if the control is continuous).

### Explicitly not undoable in US-10 v1

| Operation                                                        | Why                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Play / pause / stop / loop / scrub                               | Transport / view state; no clip mutation                                                          |
| Unsaved gizmo / Settings pose (`restorePose`)                    | Ephemeral until Save; discard is not an undo step                                                 |
| Transform mode, axes, selection, nudge                           | Viewport chrome / live TRS; nudge does not commit a clip                                          |
| Create-part spawn / duplicate / delete / clipboard               | Scene graph edits; hotkeys ship in this US, undo deferred                                         |
| `bakeBlend`, retarget, rename, replace/import clip, draft create | Out of scope or larger library ops; blend/retarget only get undo when those features opt in later |

### Snapshot vs patch (locked — v1 = snapshot)

**Decision:** undo v1 uses **before/after snapshots**, not track-level patches.

| Rule                | Detail                                                                                                                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why snapshot        | Correctness first: `saveKeyframe` can rewrite many tracks + optionally rebase `sourceClip` / bind-pose overrides; inverse patches would be fragile and easy to desync from the mixer                                                                                                                        |
| Unit of snapshot    | Per stack entry: deep-clone every `AnimationClip` the command mutates (`clip.clone()`, and `sourceClip.clone()` when that reference changes), plus plain copies of scalar/library fields the command touches                                                                                                |
| Per-command payload | `trimClip` → prior/next `{ clip, trimStart, trimEnd, duration }`; `saveKeyframe` → prior/next affected entry fields (`clip`, `sourceClip` if changed, root TRS maps if changed) + any bind-pose override map slice written in that commit; `setTimeScale` → prior/next `{ timeScale }` only (no clip clone) |
| Apply               | Undo/redo **replace** those fields on the library entry (new object references for clips), then rebind the mixer to the restored working clip and sync mixer `timeScale`                                                                                                                                    |
| Stack depth         | Unbounded in-session for v1; no persistence. Memory is acceptable for MVP clip sizes; revisit only if profiling shows pressure                                                                                                                                                                              |
| Not in v1           | Diff/patch undo (per-track sample deltas), structural share-with-COW, or compressing consecutive identical command types beyond the “one commit / coalesce drag” rule above                                                                                                                                 |

Optimize to patches later only if snapshot memory or clone cost becomes a measured problem — out of scope for this delta.

### Approach

- Command pattern: each edit pushes a snapshot pair `{ before, after }` (or equivalent `undo` / `redo` closures that close over those snapshots)
- After undo/redo: replace library working clip reference and rebind mixer action; clear selection if node missing
- Keyboard undo/redo go through the catalog (same focus rules as other shortcuts)

### Relation to US-3

- Migrate “restore pre-trim” to an undoable `trimClip` command on the stack (re-trim from `sourceClip` remains valid without using undo)

### Non-goals

No durable undo log across reloads in this story.

## Current contract touchpoints

On ship into `current/`: replace documented **W / E / R** transform hotkeys with **W / E / T**, note **R** = axes, and fold Commands modal + keymap into editor chrome / design sections.
