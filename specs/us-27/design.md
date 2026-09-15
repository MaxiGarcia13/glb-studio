# US-27 — Additional kits (design)

## Approach

1. Add recipe modules or entries under `create/domain/kits/` (e.g. `simple-building.ts`, `block-robot.ts`)
2. Register in the kit index used by the New model modal — **data only**
3. Optional: “clothes” as extra colored meshes on block figure variants can live here as a third kit (e.g. block figure with shirt/pants parts) without US-28 textures

## Non-goals

No changes to spawn, inspector, or validation unless a bug is found; this US is content + registration.
