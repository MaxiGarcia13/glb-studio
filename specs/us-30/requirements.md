# US-30 — EditorToolbar

Delta for consolidating session I/O and viewport axes into a Blender-style app menu bar. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-14 (world axes), US-19 (shared vs owned clips), US-22 (export modal), US-23 (new empty model).

**Status:** In progress.

## Story

As an editor user, I can create models / shared animations, import files, and export from a top **File** menu, and tweak world axes from a top **Settings** menu — without hunting through library headers or the Settings aside.

## Acceptance

### File menu

- [ ] Full-width `EditorToolbar` exposes a **File** text menu with: **New model**, **New animation**, **Import**, **Export**
- [ ] **New model** creates an empty `source: 'created'` model (same as today’s Models `+`); removed from the Models library header
- [ ] **New animation** creates a **shared** draft (`ownerModelId: null`, same as today’s Shared `+`); disabled when no focused model scene; removed from the Shared Animations header
- [ ] **Import** opens a multi-file picker (`.glb` / `.gltf` / `.fbx`); removed from Models (“Load models”) and Shared (“Import animations”) headers
- [ ] Per file, Import routes by content:
  - usable skinned mesh + skeleton → **model** library (embedded clips register as **owned**, unchanged US-19)
  - animations but no usable model → **Shared Animations**
  - neither → user-visible error for that file; other files in the batch still process
- [ ] **Export** opens the existing **Export** modal (US-22); does not pack immediately; removed from the Settings aside footer (“Download”)
- [ ] Per-model **Add animation** modal (Create / Import / Add existing → owned) stays on the model row — not replaced by File Import

### Settings menu

- [ ] The same menu bar exposes a **Settings** text menu with **Show world axes** and **Axes Length (m)** (same store / behavior as US-14)
- [ ] Those controls are removed from the Settings aside **Axes** block (aside may drop an empty Axes heading)

### Chrome

- [ ] Blender-style full-width top bar (above asides + preview); text triggers open menus — not a floating viewport `FloatingToolbar`
- [ ] Mounted outside `EditorPreview`; does not block orbit, pick, or existing Edit / Move / create toolbars

## Out of scope

- Full Blender chrome (workspace tabs, secondary Object/View menus, snap row)
- Moving Model root TRS, trim, speed, blend, or selection rename into this toolbar
- Changing export pack rules or merge modal fields
- Grid / rotation snap (US-25) — may join Settings later
- Persisting axes prefs across sessions (unchanged from US-14)
