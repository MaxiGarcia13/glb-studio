# US-44 — Cut holes (boolean subtract)

Delta: cut a hole through a created part using a cutter primitive (cylinder / box) via boolean **subtract**, producing one crafted mesh. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Series:** Figure craft (US-41 → US-45).

**Depends on:** **US-41** (bake + geometry undo/clipboard). Softens current out-of-scope “boolean mesh fuse” for **created subtract only** at kickoff.

**Status:** Planned — not kicked off.

## Story

As an editor user creating new figures and props, I can cut holes and openings (e.g. a tube through a block, a window slot) so the shape is not only deformed on the surface but has real voids — without leaving a separate cutter mesh in the model.

## Acceptance

- [ ] With a created model focused, user can start **Cut hole** on a selected stamped **target** part
- [ ] User places or adds a **cutter** mesh (at least **cylinder** for round holes and **box** for slots) positioned with Edit / Move as normal parts (or a dedicated cutter preview — design pick at kickoff)
- [ ] **Cut** action: boolean **subtract** cutter from target → replace target geometry with result; mark target **crafted** (US-41); **remove** cutter from the scene
- [ ] One undo entry restores pre-cut target geometry + cutter presence (or equivalent before/after craftGeometry + createScene combo documented in design)
- [ ] Failures (non-manifold, empty result, library error) show a clear message; target and cutter left unchanged
- [ ] Color / map on target preserved when possible; cutter material irrelevant after cut
- [ ] Disabled for imported / post-Skin / non-created; multi-target vague selection → clear reason
- [ ] Export shows the hole (watertight enough for typical GLTF viewers)
- [ ] Unit or adapter tests with simple overlapping box−cylinder fixture

## Out of scope

- Boolean **union** / fuse (→ US-45)
- Brush that “paints” holes without a cutter
- Multi-cutter batch in one click (MVP: one cutter per Cut)
- Cutting groups as a whole (operate on a single mesh part; user fuses first if needed)
- Server-side CSG

## Cross-links

- Foundation → [`specs/us-41/`](../us-41/)
- Brushes (sand hole rims after cut) → [`specs/us-42/`](../us-42/)
- Round corners → [`specs/us-43/`](../us-43/)
- Fuse / join → [`specs/us-45/`](../us-45/)
