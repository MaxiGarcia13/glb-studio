# US-27 — Additional kits (design)

## Approach

1. Add recipe modules or entries under `create/domain/kits/` (e.g. `simple-building.ts`, `block-robot.ts`, optional `simple-car`)
2. Register in the kit index — **data only** (optional `groups` + part `parent` for create-group hierarchy; not skinned bones)
3. UX: separate “From kit…” entry (not the Plus → empty shortcut). Plus always stays empty-from-scratch
4. Optional: clothed block figure as extra colored meshes without US-28 textures
5. **Joint select on pick (created + grouped only):** when Edit raycast hits a stamped create part whose ancestor is a stamped `createGroup`, select that nearest parent group instead of the mesh so TransformControls pose the limb. Outliner clicks stay exact (group or mesh as clicked). Bypass: Shift+click (or documented equivalent) selects the mesh for color/size/single-part work. No new skeleton / skinning — reuse US-26 groups

## Non-goals

Do not put a kit modal back on the primary New model Plus. Prefer recipe/registry changes; the joint-select raycast tweak is an allowed small viewport exception for kit armatures. Still no Mixamo auto-rig.
