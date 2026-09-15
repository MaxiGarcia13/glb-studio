# US-24 — Primitive palette + add part

Delta for freeform part creation on top of US-23 kits. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (create module, part kinds, created models).

**Status:** Not started — do not implement until US-23 has shipped (or is explicitly combined) and this US is kicked off.

## Story

As an editor user, I can add common primitive shapes to my created model so I can build props, vehicles, or figures beyond the starter kits.

## Acceptance

- [ ] When a **created** model is focused, Create UI offers an **Add part** palette: box, sphere, cylinder, capsule, plane
- [ ] Adding a part spawns it under that model’s scene at the origin (or a small default offset above ground), selects it, and uses kind default params + a default color
- [ ] New parts are named uniquely (`box`, `box_2`, …) so the selection overlay stays readable
- [ ] Added parts support the same inspector, Duplicate, Delete, and Edit Save / Restore behavior as kit parts (US-23)
- [ ] Palette is hidden or disabled for **imported** models (no accidental mesh editing of uploaded characters in this US)
- [ ] Export still packs the updated scene

## Out of scope

- Click-to-place on the grid (may land in US-25 or a follow-up)
- Cone / torus / custom `BufferGeometry` authoring
- Boolean union / subtract
- Editing meshes on imported GLBs
- Textures (US-28)
