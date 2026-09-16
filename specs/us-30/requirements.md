# US-30 — File / Settings floating toolbar

Delta for consolidating session I/O and viewport axes into a floating toolbar. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-14 (world axes), US-19 (shared vs owned clips), US-22 (export modal), US-23 (new empty model).

**Status:** Not started — do not implement until explicitly kicked off.

## Story

As an editor user, I can create models / shared animations, import files, and export from one **File** toolbar, and tweak world axes from a **Settings** section on that same chrome — without hunting through library headers or the Settings aside.

## Acceptance

### File section

- [ ] A floating toolbar exposes a **File** section with: **New model**, **New animation**, **Import**, **Export**
- [ ] **New model** creates an empty `source: 'created'` model (same as today’s Models `+`); removed from the Models library header
- [ ] **New animation** creates a **shared** draft (`ownerModelId: null`, same as today’s Shared `+`); disabled when no focused model scene; removed from the Shared Animations header
- [ ] **Import** opens a multi-file picker (`.glb` / `.gltf` / `.fbx`); removed from Models (“Load models”) and Shared (“Import animations”) headers
- [ ] Per file, Import routes by content:
  - usable skinned mesh + skeleton → **model** library (embedded clips register as **owned**, unchanged US-19)
  - animations but no usable model → **Shared Animations**
  - neither → user-visible error for that file; other files in the batch still process
- [ ] **Export** opens the existing **Export** modal (US-22); does not pack immediately; removed from the Settings aside footer (“Download”)
- [ ] Per-model **Add animation** modal (Create / Import / Add existing → owned) stays on the model row — not replaced by File Import

### Settings section

- [ ] The same floating toolbar exposes a **Settings** section with **Show world axes** and **Axes Length (m)** (same store / behavior as US-14)
- [ ] Those controls are removed from the Settings aside **Axes** block (aside may drop an empty Axes heading)

### Chrome

- [ ] Toolbar uses shared `FloatingToolbar` / `Button` patterns (icon-only where appropriate; names in `aria-label` + `title`)
- [ ] Does not block orbit, pick, or existing Edit / Move / create toolbars; mobile stacking clears sibling chrome

## Out of scope

- Top menu bar / Blender-style File dropdown (toolbar buttons only)
- Moving Model root TRS, trim, speed, blend, or selection rename into this toolbar
- Changing export pack rules or merge modal fields
- Grid / rotation snap (US-25) — may join Settings later
- Persisting axes prefs across sessions (unchanged from US-14)
