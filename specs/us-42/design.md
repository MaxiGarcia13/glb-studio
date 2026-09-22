# US-42 — Craft brushes + sanding (design)

## Approach

1. **Tool mode**
   - Add a create-scoped tool (e.g. `craftBrush`) distinct from Navigate / Edit / Move.
   - While active: raycast selected mesh; LMB stroke applies brush; RMB/orbit mapping follows Edit conflict rules (disable orbit during stroke).
   - Hide TransformControls while Brush is active.

2. **Bake on enter / first stroke**
   - Call US-41 `bakePartForCraft` before mutating verts.
   - If bake fails density policy, show error and abort stroke.

3. **Brush kernels** (`create/domain/craft-brushes/`)
   - Input: geometry, hit point (local), radius, strength, brush id, invert.
   - Collect affected vertex indices by distance in **local space**.
   - **Push/Pull:** `position += ±normal * strength * falloff(d)`.
   - **Smooth:** Laplacian / neighbor average blended by strength × falloff.
   - **Inflate:** `position += vertexNormal * strength * falloff(d)`.
   - After stroke step: `attributes.position.needsUpdate`, recompute vertex normals, update bounding sphere/box.

4. **Stroke session**
   - pointerdown: snapshot positions (undo before).
   - pointermove: apply kernel at successive hits (optional dab spacing).
   - pointerup / cancel: push `craftGeometry` undo with before/after; bump revision.

5. **UI**
   - Create toolbar: Brush toggle + brush-type segmented control (Push | Smooth | Inflate) + radius/strength sliders or compact inputs.
   - Pull = Push + invert; Deflate = Inflate + invert — document in tooltips.
   - Settings aside may mirror radius/strength when Brush active (optional; avoid duplicating if toolbar is enough).

6. **Commands**
   - Catalog entry to enter Brush tool; optional `[` / `]` radius nudge later — not required for MVP.

## Brush intent (product copy)

| Brush       | User mental model                                          |
| ----------- | ---------------------------------------------------------- |
| Push / Pull | Finger pressing into / pulling clay                        |
| Smooth      | Sandpaper — soften faceting and stroke marks               |
| Inflate     | Pump air — fatten or shrink a region without a single dent |

## Non-goals

- No Flatten/Grab/Pinch in this US (list in a later delta if needed).
- No screen-space radius unless world radius feels bad in QA — start world metres, document default.
- No symmetry plane.
