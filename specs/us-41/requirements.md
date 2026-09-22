# US-41 — Mesh craft foundation (bake + geometry undo)

Delta: shared foundation so created-model parts can leave parametric `kind + params` geometry and keep custom vertex data through edit, duplicate, paste, undo, and export. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Series:** Figure craft (US-41 → US-45). This US is the **blocker** for brushes (US-42), holes (US-44), and fuse (US-45). Round corners (US-43) can ship without this if it stays parametric-only.

**Depends on:** US-23 / US-24 (create parts), US-37 (create-scene undo + clipboard).

**Status:** Planned — not kicked off.

## Story

As an editor user building props or figures from primitives, when a tool permanently changes a part’s mesh (sculpt, cut, fuse), that shape must survive size-inspector conflicts, undo, duplicate/paste, and GLB export — otherwise craft tools are disposable toys.

## Acceptance

- [ ] Created stamped parts gain an explicit **crafted / custom-mesh** state (e.g. `createPart.sculpted` or equivalent) distinct from parametric-only parts
- [ ] **Bake** path: given a stamped part, optionally ensure minimum vertex density (subdivide policy documented in design), set crafted flag, keep material + local TRS, bump create-parts revision
- [ ] While crafted, **size fields do not rebuild geometry** (`setPartSizeParam` no-op or UI disabled with clear reason); PartInspector shows crafted state + **Reset to {kind}** (rebuild from stored kind params, clear crafted, dispose custom buffers)
- [ ] **Clipboard / duplicate / paste** round-trip crafted geometry (positions + normals + index as needed), not only `kind + params` (today’s US-37 snapshot is insufficient)
- [ ] **Undo / redo** restores crafted vertex buffers for craft operations that this foundation exposes (at least: bake-reset; stroke/boolean commands land in later USs but share the snapshot format)
- [ ] New undoable command id (e.g. `sculptGeometry` / `craftGeometry`) or documented extension of `createScene` trees so undo does not recreate a fresh primitive and drop verts
- [ ] Crafted parts still **export** via existing GLTFExporter path (live `BufferGeometry`)
- [ ] Craft tools and bake are **created models only**; imported / skinned library models never enter craft bake from this US
- [ ] After **Skin model** (US-34), craft bake / Reset are **disabled** on that model in MVP (clear disabled reason) — avoid fighting rigid weights
- [ ] Unit tests: bake blocks size rebuild; clipboard instantiate restores verts; Reset restores parametric geometry; Skin gate

## Out of scope

- Brush UI, stroke math, boolean CSG, parametric bevel (later USs)
- Multiresolution sculpt, remesh, dynamic topology
- Craft on imported meshes or post-Skin models
- Persisting crafted state across browser reloads beyond the in-memory model (session library as today)
- Guaranteeing crafted `userData` survives export → re-import as editable crafted parts (re-import may become opaque created mesh; document behavior)

## Cross-links

- Brushes + sanding → [`specs/us-42/`](../us-42/)
- Round corners (parametric) → [`specs/us-43/`](../us-43/)
- Holes (subtract) → [`specs/us-44/`](../us-44/)
- Fuse / join (union) → [`specs/us-45/`](../us-45/)
