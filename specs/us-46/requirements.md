# US-46 — Color-map undo + library texture rows

Delta: session undo/redo for albedo apply / replace / clear, and library UI to see / remove maps on skinned models. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-10 (undo stack), US-28 / US-39 (created maps), **US-40** (shipped — skinned albedo apply).

**Status:** In progress — kicked off.

**Note:** Albedo (`.map`) only. Does not add prep modal on skinned materials. Does not make undo durable across reloads.

## Story

As an editor user, when I apply, replace, or clear a color map on a created part or a skinned library model, I can undo and redo that change in the session; and when a skinned model has a map, I can see it under that model in the Library and clear it without hunting for the floating toolbar.

## Acceptance

### Undo / redo

- [ ] Apply / replace / clear of `MeshStandardMaterial.map` on a **created** stamped part pushes one undo entry; Cmd/Ctrl+Z restores the previous map (or no map); redo restores the committed map
- [ ] Apply / replace / clear on a **skinned** library target (US-40 path) pushes the same command kind; undo/redo restores correctly
- [ ] Failed decode / rejected file does **not** push an undo entry; live map unchanged
- [ ] Undo does not leave a black / disposed map on the material (snapshot owns clones; live dispose only when safe)
- [ ] Stack pruning / replacing redo branch disposes orphaned texture clones (no GPU leak)
- [ ] Existing undo kinds (pose, trim, create scene/hierarchy) still work; texture commits interleave on the same session stack

### Library (skinned)

- [ ] Under each `isSkinnedLibraryModel` in the Library, when any skinned mesh has a `.map`, show a nested row (or rows) with a clear label (prefer `texture.name` / file name; fallback “Texture”)
- [ ] Multi-mesh: one row per textured skinned mesh (include mesh name when useful)
- [ ] Row offers **clear** (and optionally replace) without opening US-39 prep
- [ ] Clearing from the Library uses the same clear + undo path as the floating tool
- [ ] Rows update after apply / clear / undo / redo (revision signal or equivalent)
- [ ] No texture row when the model has no maps; created models keep existing part toolbar / prep clear (optional: no new created-part library texture chrome in this US)

## Out of scope

- Texture prep modal on skinned / imported materials
- Full PBR maps; UV unwrap; texture painting
- Undo for color-only edits (`material.color` without map)
- Persisting undo across reloads
- Kenney kit auto-picker / content pack UI
- Drag-and-drop texture onto library rows (nice-to-have later)

## Cross-links

- Skinned apply UI → US-40 (shipped in `current/`)
- Created maps + prep → US-28 / US-39 (shipped in `current/`)
- Undo stack → US-10 (shipped in `current/`)
