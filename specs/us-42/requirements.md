# US-42 — Craft brushes + sanding

Delta: viewport brushes that deform a **crafted** created part (push/pull, smooth/sand, inflate). Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Series:** Figure craft (US-41 → US-45).

**Depends on:** **US-41** (bake, crafted flag, geometry undo/clipboard). Do not implement before US-41 ships or is explicitly combined in one kickoff.

**Status:** Planned — not kicked off.

## Story

As an editor user shaping a figure from primitives, I can brush the surface of a selected part — push and pull clay-like forms, sand/smooth rough areas, and inflate volume — so the mesh looks like an intentional shape rather than an untouched solid.

## Acceptance

- [ ] With a **created** model focused and a stamped part selected, user can enter a **Brush / Sculpt** tool (create toolbar or edit-tool sibling; catalog hotkey documented)
- [ ] Entering Brush on a parametric part **bakes** it first (US-41); already-crafted parts skip re-bake unless density policy requires it
- [ ] Brushes available in MVP:
  - **Push** — displace along hit normal inward
  - **Pull** — displace along hit normal outward (may be Push + invert modifier)
  - **Smooth (Sand)** — average neighbor positions toward local mean (sanding)
  - **Inflate / Deflate** — displace along each vertex’s own normal (invert = deflate)
- [ ] Shared controls: **radius**, **strength**, soft falloff; invert via held modifier (e.g. Shift) where applicable
- [ ] Pointer drag applies continuous stroke on the **selected** mesh only; orbit / TransformControls do not fight LMB stroke (same conflict pattern as gizmo drag)
- [ ] Pointer-up commits **one** undo entry (US-41 `craftGeometry`); mid-stroke is not a stack of micro-undos
- [ ] Normals (and bounds) update so lighting stays correct after strokes
- [ ] Brush tool hidden / disabled for imported focus, no selection, post-Skin models, or non-part selection — with clear reason
- [ ] Export retains brushed shape (via live geometry + US-41)
- [ ] Unit or integration tests for at least one brush kernel (displace + smooth) on a tiny BufferGeometry fixture

## Out of scope

- Flatten / Scrape, Grab, Pinch/Crease, Clay strips (candidates for a follow-up US)
- Multires, remesh, masking, symmetry, texture painting
- Brush holes (use US-44 boolean cut)
- Round corners via brush (prefer US-43 parametric bevel)
- Craft on imported / skinned meshes

## Cross-links

- Foundation → [`specs/us-41/`](../us-41/)
- Round corners → [`specs/us-43/`](../us-43/)
- Holes → [`specs/us-44/`](../us-44/)
- Fuse → [`specs/us-45/`](../us-45/)
