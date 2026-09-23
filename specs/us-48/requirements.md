# US-48 — Session skin list + Library rows (created + skinned)

Delta: Library shows and clears applied color maps on **created parts** and **skinned models**; skinned models keep a **session list of skins** so the user can pick one or none. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** **US-40** / **US-46** (skinned albedo apply / clear / session undo + Library texture rows) — already shipped in `current/`.

**Status:** Kicked off — scoped in [`specs/current/`](../current/); implement against `current/` + this delta’s tasks.

Independent of **US-47** (atlas Skin editor). When US-47 ships, Apply should add or replace an entry in this list rather than invent a second material stack.

## Story

As an editor user, when I apply a texture to a created part or a skinned model, I can see it under that asset in the Library and remove it there. On a skinned model I can keep **more than one** skin in the session, pick which one is live, or pick **none**.

## Acceptance

### Created parts (Library rows)

- [x] After Apply from the US-39 prep modal (or equivalent created color-map commit), the focused created model’s Library entry shows a nested texture row **under that part**
- [x] Row label prefers `texture.name` / file name; fallback “Texture”
- [x] Row offers **clear** (and optionally replace) without requiring the prep modal; uses the same `materialColorMap` undo path as existing created apply/clear
- [x] No texture row when the part has no `.map`; rows update after apply / clear / undo / redo (`$materialMapsRevision` or equivalent)
- [x] Created parts do **not** get a multi-skin candidate list in this US (current map only)

### Skinned models — session skin list

- [x] Each skinned library model has a session list: `skins[]` + `activeSkinId | null` (not GLB extras; not durable across reload)
- [x] Applying a new image (US-40 file path) **always appends** a list entry and makes it active; previous entries stay unless the user removes them (no replace-in-place of the active entry)
- [x] Library under the model shows **one row per list entry** (not only meshes that currently have `.map`)
- [x] Selecting a skin row applies that skin to the resolved US-40 target (`commitMaterialColorMapChange`); an explicit **“No skin”** row clears the live map and sets `activeSkinId` to `null` (deselect-all is not the primary none path)
- [ ] Removing a list entry disposes that session texture; if it was active, live map clears as **one** undoable command (remove entry + clear map; one undo restores both)
- [x] Multi-mesh: apply still follows `resolveSkinnedTextureTarget` (selected skinned mesh, else sole mesh); list is **per model**, not one independent wardrobe per mesh unless kickoff explicitly splits
- [x] Rows update after apply / pick / clear / undo / redo; empty list when the model has no session skins
- [x] Model remove / replace / unload disposes remaining list textures (no GPU leak)
- [ ] On skinned model add / replace / load, if the resolved US-40 target already has a `.map`, **seed** one list entry from it (active; label from `texture.name` / fallback “Texture”); otherwise the list stays empty until first apply

### Shared

- [x] Failed decode / rejected file does not add a list entry and does not push undo
- [x] Export GLB includes only the **active** map on the material; inactive skins are session-only
- [x] Prep modal remains the authoring path for created parts; skinned still has no US-39 prep (US-47 is the atlas editor)

## Out of scope

- US-47 Skin editor UI (keep as follow-on Apply → list)
- Full PBR maps; UV unwrap / painting
- Durable skins across reload
- Kenney / vendor auto-picker; drag-and-drop onto Library rows
- Multi-skin candidate list on every created part
- One independent skin list per skinned mesh (MVP: one list per model)

## Product intent

1. User textures a created part → Library shows the map under the part → can clear from Library.
2. User applies skin A on a character → Library lists A (active). Applies skin B → list is A + B, B active. Picks A → A live. Picks **No skin** → no map. Removes B → B gone from list.
3. Export only what is currently on the mesh.

## Cross-links

- Skinned albedo + Library rows (meshes with `.map`) → US-40 / US-46 in [`specs/current/`](../current/)
- Created part texture prep → US-39
- Atlas Skin editor → [`specs/us-47/`](../us-47/)
