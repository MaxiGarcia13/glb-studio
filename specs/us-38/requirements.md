# US-38 — Add-part MRU menu + browse modal

Delta for a short recent/suggested Add-part menu and a full catalog modal with type groups and a small 3D preview. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-24 (primitive palette + add part).

**Status:** In progress.

## Story

As an editor user, when I open **Add part** I see a short list of suggested or recently used shapes so I can add common parts quickly, and I can open **See more** to browse every kind grouped by type with a small 3D preview before picking one.

## Acceptance

- [ ] When a **created** model is focused, the Add-part control opens a compact menu of **exactly five** part rows plus a final **See more** row (not a flat list of every kind)
- [ ] **Cold start** (no stored history) shows defaults in order: box, sphere, capsule, dodecahedron, cone, then **See more**
- [ ] Choosing a part (from the compact menu or from **See more**) adds it as today (US-24) and records it as the most recently used kind
- [ ] Compact menu slots are an **MRU window of five**: newest used kind first; re-picking a kind already in the list moves it to the front with no duplicate; kinds past five drop off the bottom
- [ ] Until five distinct kinds have been used, unused default suggestions still fill the remaining slots (MRU first, then remaining defaults in default order)
- [ ] The ordered list of up to five kind ids persists in **localStorage** and restores on reload
- [ ] **See more** opens a modal listing **all** registered part kinds, grouped by type (Solids / Planar / Polyhedra, matching the existing kind folders)
- [ ] The modal shows a **small 3D preview** of the **selected** kind (click a row to select) so the user can see the shape before adding; an **Add part** confirm button adds the selected kind, updates MRU, and closes
- [ ] Choosing a kind from the compact menu (or confirming in **See more**) adds the part, updates MRU, and closes the modal when applicable
- [ ] Palette / menu / modal remain hidden for **imported** model focus (same gate as US-24)

## Out of scope

- Frequency ranking (“most used” by count) — this US is **most recently used** only
- Custom user-defined default suggestion list
- Persisting camera orbit or material settings inside the preview
- Changing spawn/default params or export behavior for parts
