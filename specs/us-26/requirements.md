# US-26 — Part hierarchy, outliner, and group

Delta for parenting / grouping parts (and models), navigating parts by name, and exporting grouped models as one GLB. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (named parts on created models). **Touches:** US-22 export merge (replace Merge toggle with editor groups).

**Status:** In progress (kicked off).

## Story

As an editor user, I can group parts (and models) with a familiar multi-select + context menu so a car body moves with its wheels attached, find parts by name in an outliner, and export models that share a group as one GLB without a separate Merge checkbox.

## Acceptance

### Parts / outliner

- [ ] Created-model parts can be **grouped** into an empty group node so moving the group in Edit moves children (normal Object3D hierarchy)
- [ ] **Ungroup / unparent** is available so users can fix mistakes (world transform preserved; Ungroup dissolves empty groups)
- [ ] A simple **part outliner** lists mesh part names and group nodes for created models; clicking a row selects that node; parents can collapse/expand
- [ ] Outliner updates when parts are added, duplicated, deleted, renamed, or regrouped
- [ ] Imported models are unchanged for **bone** outliners (no skeleton-bone outliner in this US)

### Multi-select + context menu

- [ ] **Shift+click** adds/removes from a multi-selection in the **library sidebar** (model rows and part outliner) and in the **viewport preview**
- [ ] Part multi-select and model multi-select do **not** mix in one selection
- [ ] **Right-click** opens an ActionMenu-style panel with **Group** / **Ungroup** when the selection allows it (library and preview)
- [ ] Group target: Group creates a new empty **group** node; all selected items become its children (parts: `Object3D` empty in the scene; models: named session group in the library tree). Last-clicked is not used as the parent mesh/model.
- [ ] Settings-sidebar **Parent** `<select>` is removed (grouping is context-menu only); create-toolbar Unparent may remain or move into the menu

### Models + export

- [ ] Users can **group / ungroup models** with the same Shift+click + right-click pattern
- [ ] **Export** (File → Export only) packs each **model group** as **one GLB** (same pack outcome as today’s merge: shared root, bone prefixes as needed, Scene bake path preserved or adapted)
- [ ] Ungrouped models still export as separate GLBs (US-5 default)
- [ ] Export modal **Merge visible models** checkbox is **removed** — grouping in the editor is the opt-in for one-file export

## Out of scope

- Full Blender-style collections / drag-and-drop reparent in the outliner
- Reordering draw calls / material batches
- Bone hierarchy editing on imported rigs
- Opening the Export modal from the library or preview (Export stays on the Export control only)
- Boolean mesh “merge” (fuse geometries) — Group means hierarchy / export pack only
