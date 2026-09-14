# US-22 — Export modal + merge visible models

Delta for zip download UX and optional merged scene GLB. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-5 (zip export), US-20 (multi-model preview).

## Story

As an editor user, when I press Download I can confirm what will be packed and optionally merge every model currently visible in the viewport into one GLB, choosing which animation each character contributes to a Scene take (e.g. a fight).

## Acceptance

- [ ] Download opens an **Export** modal (does not pack immediately)
- [ ] Modal shows a short summary of what will be packed; primary action confirms and builds the zip
- [ ] **Merge visible models** toggle is available when two or more models are in `previewModelIds`; disabled / hidden otherwise
- [ ] **Merge off (default):** existing US-5 zip — one `{model}.glb` per loaded model (owned ready + fitting shared inside each); one animation-only `{clip}.glb` per shared working clip; owned clips ship only inside their model GLB
- [ ] **Merge on:** zip contains one `merged.glb` from all **previewed** models with **unique bone-name prefixes**; the modal lets the user pick **one clip per visible model** (owned ready or fitting shared; default = current library selection); those picks bake into **one Scene clip only** (different clips per character = fight take); no solo per-model clips; no per-model GLBs; hidden models omitted
- [ ] **Merge on:** zip also contains one animation-only `{clip}.glb` per **shared** working clip (unprefixed sidecars); owned clips are not emitted as sidecars
- [ ] Filename collisions inside the zip still get a numeric suffix; exporter / zip failure does not download a partial archive
- [ ] Modal edits **zip** basename, **merged** GLB basename, and **Scene** clip name when merge is on; per-model basenames when merge is off; empty/invalid → defaults; extensions auto-applied
- [ ] Animation-only file names stay library clip names (no per-clip rename in the modal)

## Out of scope

- Per-row download buttons
- Geometry welding / `BufferGeometry` merge
- Checklist to pick individual models independent of the library eye toggle
- Per-clip filename inputs in the export modal
- Playing multiple solo clips at once inside the editor on a single merged import (use the Scene clip for that)
