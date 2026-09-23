# US-48 — Session skin list + Library rows (design)

## Approach

1. **Created parts — display the live map**
   - Extend Library `PartOutliner` (or a nested row component) to list the current `MeshStandardMaterial.map` when present.
   - Clear / optional replace call existing `commitMaterialColorMapChange`.
   - Subscribe to `$materialMapsRevision` so Apply from the prep modal refreshes rows.
   - No `skins[]` store for created primitives in this US.

2. **Skinned models — session wardrobe**
   - Store keyed by `modelId`: `{ id, label, texture }[]` + `activeSkinId: string | null`.
   - Add on successful US-40 load (**always append** a new list entry + set active; never overwrite the previous active entry in place). Clone or take ownership so undo snapshots stay consistent with US-46 (snapshot owns clones; dispose only when safe).
   - Pick active → commit that texture onto the resolved target; pick none → commit `next: null`.
   - Remove entry → drop from store + dispose; if active, clear live map in the **same** undo command (not remove-then-clear as two stack entries).
   - Replace US-46 “row iff mesh has `.map`” for skinned Library chrome with this list. Toolbar apply still works; it feeds the list.

3. **Target / apply**
   - Reuse `resolveSkinnedTextureTarget` / availability helpers. Do not apply to every skinned mesh unless kickoff says so.
   - Export unchanged: pack live materials only.

4. **UI**
   - Created: nested texture row under the part (label, clear).
   - Skinned: nested skin rows under the model; selected = active; affordance for none; remove; add still from existing file toolbar (optional “add without replacing list” is default).
   - Tokens: `editor-ui-tokens`; `AssetEntry` / Library collapsible patterns.

5. **Module placement**
   - Prefer `create/` next to material-map undo + `SkinnedTextureRows`.
   - Store/actions for the list; domain helpers for label / dispose; no R3F in domain.

## Non-goals

- Rewriting US-39 prep.
- Durable IndexedDB skin libraries.
- Per-mesh wardrobes.
- Shipping US-47 in the same PR.

## Kickoff decisions

| Topic | Decision |
|-------|----------|
| Undo on **remove active** | **One command** — drop list entry + clear live map together; one undo restores both. Avoids a confusing half-state (row back / map still cleared or the reverse). |
| File apply | **Always append** — successful US-40 / toolbar / file apply adds a new `skins[]` entry and makes it active; earlier entries remain until the user removes them. No in-place replace of the active entry. |
| None UI | *Open* — explicit “No skin” row vs deselect-all |
| Import seed | *Open* — seed from existing `.map` vs empty until first apply (recommend: **seed**) |
