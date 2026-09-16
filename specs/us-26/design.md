# US-26 — Part hierarchy, outliner, and group (design)

## Approach

### Parts hierarchy (done / keep)

1. **Domain:** `parentPart(child, parent, partsRoot)` via `Object3D.attach` (world transform preserved). `unparentPart` → parts root. Cycle guard: reject self / descendant parents. `listCreatedParts` / `listCreatedPartEntries` / `listParentCandidates`.
2. **Outliner:** `PartOutliner` under each created model in Models — names, depth indent, collapse chevron for parents; click → Edit + `selectObject`; `$createPartsRevision` on add / duplicate / delete / parent / unparent.
3. **Legacy UI to remove:** Settings **Parent** `<select>` (and optionally toolbar Unparent once context menu covers it).

### Multi-select + Group / Ungroup menu

1. **Selection store** (`$selection`): `kind: 'none' | 'parts' | 'models'` — parts and models never mix in one selection.
   - **Parts:** `object` = active (last-clicked) Object3D; `objects` = full set including active; `modelIds` empty.
   - **Models:** `modelIds` = selected library ids (last = Group/Ungroup anchor); `object` / `objects` empty.
   - **API:** `selectObject` / `selectModelIds` = plain click replace; `toggleObject` / `toggleModelId` = Shift+click; `clearSelection` clears all. Switching kind clears the other side (and discards unsaved pose when leaving a part).
2. **Surfaces:** library model rows, part outliner rows, viewport raycast picks — same modifiers.
   - Library: plain click replaces (`selectModel` + `selectModelIds([id])`, or `selectObject`); **Shift+click** calls `toggleModelId` / `toggleObject` (does not toggle model focus off).
   - Row highlight: model rows use `$selection.modelIds` when `kind === 'models'`, else focus; part rows use `$selection.objects`.
3. **Context menu:** ActionMenu-style floating panel on **right-click** (reuse placement / portal patterns from `action-menu`). Items: **Group**, **Ungroup** (disabled with clear reason when invalid).
4. **Group (parts):** non-active selected parts parent under the **active** (last-clicked) part on the same created model; skip / reject cycles.
5. **Ungroup (parts):** selected parts → parts root (`unparentPart`), world preserved.
6. **Group (models):** record a session **model group** (library tree + shared transform root or explicit group id). Do not mix models and parts in one Group action.
7. **Ungroup (models):** dissolve group membership; models become independent again.

### Export (replaces US-22 Merge toggle)

1. Export still opens **only** from File → Export / export button.
2. When packing: each **model group** → one GLB (reuse `packMergedModelsGlb` / namespace + Scene bake ideas for members of that group). Ungrouped models → one GLB each (US-5).
3. Remove **Merge visible models** checkbox and `mergeModels` modal state; preview eye still controls visibility / inclusion as today where applicable.
4. Scene clip / per-model clip picks: keep when a group has ≥2 skeletons that need a multi-character bake; otherwise simplify per design when implementing.

## Non-goals

No drag-and-drop reparent; no bone outliner for imported rigs; no boolean mesh merge; Export not opened from library/preview.
