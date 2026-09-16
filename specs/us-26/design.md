# US-26 — Part hierarchy, outliner, and group (design)

## Approach

### Parts hierarchy (done / keep)

1. **Domain:** `parentPart` / `attachUnder` via `Object3D.attach` (world transform preserved). Cycle guard: reject self / descendant parents. Empty create groups + `listCreatedPartEntries`. Ungroup dissolves groups or lifts nested nodes to the parts root.
2. **Outliner:** `PartOutliner` under each created model in Models — names, depth indent, collapse chevron for parents; click → Edit + `selectObject`; `$createPartsRevision` on add / duplicate / delete / parent / unparent.
3. **Hierarchy UI:** context-menu **Group / Ungroup** only (Settings Parent and toolbar Unparent removed).

### Multi-select + Group / Ungroup menu

1. **Selection store** (`$selection`): `kind: 'none' | 'parts' | 'models'` — parts and models never mix in one selection.
   - **Parts:** `object` = active (last-clicked) Object3D; `objects` = full set including active; `modelIds` empty.
   - **Models:** `modelIds` = selected library ids (last = Group/Ungroup anchor); `object` / `objects` empty.
   - **API:** `selectObject` / `selectModelIds` = plain click replace; `toggleObject` / `toggleModelId` = Shift+click; `clearSelection` clears all. Switching kind clears the other side (and discards unsaved pose when leaving a part).
2. **Surfaces:** library model rows, part outliner rows, viewport raycast picks — same modifiers.
   - Library: plain click replaces (`selectModel` + `selectModelIds([id])`, or `selectObject`); **Shift+click** calls `toggleModelId` / `toggleObject` (does not toggle model focus off).
   - Viewport (Edit): plain click → `selectObject`; **Shift+click** picked mesh/bone → `toggleObject` (soft-focus owner with `preserveSelection` so the multi-set is not wiped). Miss + Shift → no-op.
   - Viewport (Move): plain click focuses model root; **Shift+click** owner → `toggleModelId` (model multi-select).
   - Row highlight: model rows use `$selection.modelIds` when `kind === 'models'` (anchor = last id, stronger fill); else focus. Part rows use `$selection.objects` (active = `$selection.object`, stronger fill).
   - Viewport: `SelectionHighlight` draws a wireframe marker per selected part/bone, or an AABB per selected model root; name overlay shows active name `(+N)` or model count.
3. **Context menu:** `PointerActionMenu` (ActionMenu-style portal) at pointer via `$selectionContextMenu`. Hosted once in `EditorToolbar`. Opens from library model/part rows and viewport canvas right-click (click without drag — drag keeps orbit/pan). Dismiss on outside pointerdown / Escape. Group / Ungroup items stubbed disabled until following tasks.
4. **Group (parts):** create a stamped empty `Group` (`group`, `group_2`, …) under the parts root; **attach all** selected create parts/groups under it (world-preserving). Select the new group. Not “parent under active mesh.”
5. **Ungroup (parts):** if selection includes empty group(s), dissolve them (children → former parent / parts root, remove group); else lift nested parts to parts root.
6. **Group (models):** create a named session **model group** in `$modelGroups`; selected models become members (library tree shows `group` → models). Same empty-container pattern as parts. Do not mix models and parts in one Group action.
7. **Ungroup (models):** dissolve group membership for the selection (empty groups removed).

### Export (replaces US-22 Merge toggle)

1. Export still opens **only** from File → Export / export button.
2. When packing: each **model group** (≥2 members) → one GLB via `packMergedModelsGlb` (bone prefixes + optional Scene bake). Ungrouped models → one GLB each (`packModelGlb`).
3. **Merge visible models** checkbox and `mergeModels` removed — editor model groups are the opt-in for one-file export.
4. Export modal shows Scene clip picks when any multi-model group exists; file-name fields cover zip, each group GLB, and each ungrouped model.

## Non-goals

No drag-and-drop reparent; no bone outliner for imported rigs; no boolean mesh merge; Export not opened from library/preview.
