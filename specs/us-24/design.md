# US-24 — Primitive palette (design)

## Approach

1. Reuse US-23 `PartKind` registry; add `plane` kind
2. Create chrome: “Add part” button group or select that calls `addPart(modelId, kindId)`
3. Naming: `nextPartName(scene, kindId)` → `box`, `box_2`, …
4. Spawn parent = created model’s parts root / scene; then existing selection + inspector apply

## Layers

- `create/domain/` — `plane` kind, `spawnPart` / naming helpers
- `create/actions/` — `addPart(modelId, kindId)` (store lookup + created-only guard; returns mesh for selection)
- `create/components/` or `editor-shell` — palette UI gated on `source === 'created'`
- No changes to import validation or animation

## Non-goals

No grid raycast spawn in this US unless already trivial; prefer origin spawn for a clear MVP.
