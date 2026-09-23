# US-48 — Session skin list + Library rows (design)

## Approach

1. **Created parts — display the live map**
   - Extend Library `PartOutliner` (or a nested row component) to list the current `MeshStandardMaterial.map` when present.
   - Clear / optional replace call existing `commitMaterialColorMapChange`.
   - Subscribe to `$materialMapsRevision` so Apply from the prep modal refreshes rows.
   - No `skins[]` store for created primitives in this US.

2. **Skinned models — session wardrobe**
   - Store keyed by `modelId`: `{ id, label, texture }[]` + `activeSkinId: string | null`.
   - Add on successful US-40 load; clone or take ownership so undo snapshots stay consistent with US-46 (snapshot owns clones; dispose only when safe).
   - Pick active → commit that texture onto the resolved target; pick none → commit `next: null`.
   - Remove entry → drop from store + dispose; if active, clear live map.
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

## Open kickoff decisions

- Undo granularity when removing the **active** skin (one command vs remove-then-clear).
- Whether replace-from-file updates the active entry in place or always appends (recommend: **append**, keep previous).
- None-picker: explicit “No skin” row vs deselect-all.
- If a model already has a baked `.map` on import, seed one list entry from it or wait until first apply (recommend: **seed from existing map** so Library matches viewport).
