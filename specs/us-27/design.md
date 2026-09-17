# US-27 — Additional kits (design)

## Approach

1. Add recipe modules or entries under `create/domain/kits/` (e.g. `simple-building.ts`, `block-robot.ts`, optional `simple-car`)
2. Register in the kit index — **data only** (optional `groups` + part `parent` for create-group hierarchy; not skinned bones)
3. UX: separate “From kit…” entry (not the Plus → empty shortcut). Plus always stays empty-from-scratch
4. Optional: clothed block figure as extra colored meshes without US-28 textures

## Non-goals

Do not put a kit modal back on the primary New model Plus. No changes to spawn/inspector unless a bug is found; this US is content + registration + secondary entry point.
