# US-26 — Part hierarchy and outliner

Delta for parenting parts and navigating them by name. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (named parts on created models).

**Status:** In progress (kicked off).

## Story

As an editor user, I can parent parts to each other and pick them from a list so a car body moves with its wheels attached, and I can find parts by name without hunting in the viewport.

## Acceptance

- [ ] Created-model UI can **parent** the selected part to another part on the same model (or to the model root / parts root)
- [ ] After parenting, moving the parent in Edit moves children with it (normal Object3D hierarchy)
- [ ] A simple **part outliner** lists mesh part names for the focused created model; clicking a row selects that part
- [ ] Outliner updates when parts are added, duplicated, deleted, or renamed (if rename exists; otherwise names from US-23/24)
- [ ] Unparent / parent-to-root is available so users can fix mistakes
- [ ] Imported models are unchanged (no outliner required for skeleton bones in this US)

## Out of scope

- Full Blender-style collections / multi-select group operators
- Reordering draw calls / material batches
- Bone hierarchy editing on imported rigs
- Drag-and-drop reparent in the outliner (list + explicit Parent control is enough)
