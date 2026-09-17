# US-10 design

## Scope

1. In-memory **undo/redo** command stack for clip-mutating editor operations.
2. Shared **editor command catalog** + hotkey dispatcher + **Commands** modal (docs from the same catalog).

## Command catalog & hotkeys

### Placement

- Module: `commands` — owns the cross-cutting catalog, dispatcher, and hotkey listener (not chrome layout).
- Pure catalog: `commands/domain/editor-commands.ts` — `{ id, chords, label, category }` only; no store writes.
- Dispatcher: `commands/actions/run-editor-command.ts` — maps ids to existing module actions (`play` / `pause`, `saveKeyframe`, transform mode / axes, `deleteSelectedPart`). Nudge / create-part clipboard / undo-redo handlers stay no-ops until their wire tasks land.
- Listener: `commands/hooks/use-editor-command-hotkeys` — single window listener (mounted from `EditorToolbar`); absorbs / replaces `use-transform-mode-hotkeys`.
- Docs UI: `CommandsModal` opened from a **Commands** control on `EditorToolbar` (`editor-shell`); body rendered from the `commands` catalog.

### Keymap (locked)

Single source of truth for the catalog. **Cmd** = meta on macOS; **Ctrl** elsewhere. Letter keys are case-insensitive. Remap from today’s **W / E / R** (scale): transform modes **Q / W / E** = Move / Rotate / Scale; **R** = axes.

| Command id         | Chord(s)                     | Label               | Category  |
| ------------------ | ---------------------------- | ------------------- | --------- |
| `playPause`        | Space                        | Play / Pause        | Playback  |
| `toggleAxes`       | R                            | Toggle world axes   | Viewport  |
| `transformMove`    | Q                            | Move                | Transform |
| `transformRotate`  | W                            | Rotate              | Transform |
| `transformScale`   | E                            | Scale               | Transform |
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

### Nudge (locked)

| Rule         | Decision                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step         | **`$viewportSettings.gridStepMetres`** (default **0.1** m, same constant as `GRID_STEP_METRES_DEFAULT`). One Settings dial drives grid snap and arrow nudge.                                    |
| Space        | Matches TransformControls: **Edit = local**, **Move = world**.                                                                                                                                  |
| Target       | Same as the gizmo: Edit → `$selection.object`; Move → active model root (`scene`).                                                                                                              |
| Axes         | ← / → = −X / +X; ↑ / ↓ = +Y / −Y; Shift+↑ / Shift+↓ = +Z / −Z (catalog ids above).                                                                                                              |
| No-op when   | Navigate tool; no movable target; focus in a typing field.                                                                                                                                      |
| Side effects | Same as a gizmo translate tick: pause playback, suspend mixer bindings, capture pre-edit if needed, mark pose dirty (Save / Restore still apply). Nudge is **not** an undo-stack command in v1. |
| Out of scope | Rotation / scale nudge; camera nudge; multi-selection.                                                                                                                                          |

### Create-part clipboard (locked — MVP limits)

| Rule                        | Decision                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eligible target             | Mesh with valid `userData.createPart` (`readCreatePart` non-null) on the **focused** model with `source === 'created'`, and in that model’s scene                                                                                                              |
| Copy (`copyCreatePart`)     | Snapshot into an **in-session** buffer: `{ kind, params, color, local TRS }`. Does not use the OS clipboard. No-op if selection is not an eligible part                                                                                                        |
| Paste (`pasteCreatePart`)   | Spawn a new stamped part from the buffer into the focused created model (same path spirit as `duplicatePart` / `spawnPart`: fresh geometry + material, unique name, slight offset). Select the new mesh. No-op if buffer empty or focused model is not created |
| Delete (`deleteCreatePart`) | Call existing `deleteSelectedPart` / `deletePart`. No-op if selection is not an eligible part                                                                                                                                                                  |
| Buffer lifetime             | Session-only; cleared on full page reload. Overwritten on each successful Copy. Survives model focus changes within the session so paste can target another created model                                                                                      |
| Groups                      | Empty create groups are **not** copy/paste/delete targets in v1 (parts only). Group delete stays whatever the create UI already allows outside these hotkeys                                                                                                   |

**Explicitly out of scope (must no-op)**

- Bones / skinned joints on imported or created rigs (no bone removal)
- Imported meshes / GLB submeshes without `createPart` stamp
- Full model cut / copy / paste
- Multi-selection clipboard
- System clipboard interop; Cut (Cmd/Ctrl+X)
- Undo/redo of create-part copy/paste/delete (deferred; hotkeys ship without stack entries)

### Focus rules

Ignore chords when `isTypingTarget` (`commands/utils/is-typing-target.ts`: input / textarea / select / contenteditable, including nested editables), except where a control explicitly handles its own keys. Prevent default for app-owned chords (e.g. Cmd+S) so the browser does not intercept.

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

On ship into `current/`: replace documented **W / E / R** transform hotkeys with **Q / W / E** (Move / Rotate / Scale), note **R** = axes, and fold Commands modal + keymap into editor chrome / design sections.
