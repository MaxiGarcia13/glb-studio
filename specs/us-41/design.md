# US-41 — Mesh craft foundation (design)

## Problem

Created parts are parametric: `setPartSizeParam` disposes geometry and calls `kind.createGeometry(params)`. Clipboard / create-scene undo (`snapshotCreatePart`) store only `kind`, `params`, TRS, color — **not** vertex buffers. Any sculpt/boolean edit would vanish on size tweak, paste, or undo-add unless this contract changes.

## Approach

1. **Extend `CreatePartUserData`**
   - Keep `kind` + `params` (identity for Reset and naming).
   - Add `crafted?: boolean` (name bikeshed OK — `sculpted` / `customMesh`).
   - Optional: store last parametric params forever so Reset always works.

2. **`bakePartForCraft(mesh, options?)`**
   - No-op if already crafted (unless `forceSubdivide`).
   - Density: if vertex count below kind-specific floor, subdivide once (box/sphere/capsule policies in one domain helper). Prefer deterministic Three.js subdiv or regenerate with higher segment counts where the kind supports it.
   - Set `crafted: true`, write userData, `bumpCreatePartsRevision`.
   - Do **not** change material or TRS.

3. **Gate size rebuild**
   - `setPartSizeParam`: if crafted → return early.
   - PartInspector: hide size fields when crafted; show “Custom mesh” + Reset.
   - `resetCraftedPart(mesh)`: `createGeometry(params)`, clear crafted, dispose old buffers.

4. **Clipboard payload**
   - Extend `CreatePartClipboardPartNode` with optional geometry blob when crafted, e.g.:
     - `positions: number[]` (or base64 Float32)
     - `normals?: number[]`
     - `index?: number[]`
     - `uvs?: number[]` (preserve maps when present)
   - `snapshotCreatePart`: if crafted, copy attributes from live geometry.
   - `instantiateClipboardPayload`: if geometry present, build `BufferGeometry` instead of `kind.createGeometry`; still stamp kind/params/crafted.

5. **Undo**
   - Prefer dedicated command id `craftGeometry` with before/after attribute snapshots (or full geometry clone) scoped to `modelId` + `meshUuid`.
   - Stroke/boolean USs push one command per completed op; this US lands the apply helper + at least Reset undo.
   - Do **not** overload `saveKeyframe` scene TRS snapshots for vertex data.

6. **Lifecycle gates**
   - Created focus + stamped `createPart` only.
   - If model has been Skinned (US-34 → treated as skinned library), disable bake/Reset/craft entry points.

7. **Export / re-import**
   - Export: no special case — exporter already packs mesh attributes.
   - Re-import: may lose `createPart` crafted metadata; acceptable MVP — document as opaque mesh under created detection rules if any.

## Module map

| Concern                                         | Layer                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Bake, reset, density policy, read/write crafted | `create/domain/`                                                 |
| Clipboard geometry fields                       | `create/types` + `create/domain/hierarchy/create-part-clipboard` |
| Undo command type + apply                       | `animation/types/undo-stack` + `create/domain` apply helper      |
| Inspector crafted UI                            | `create/components/part-inspector`                               |
| Revision bump                                   | existing `$createPartsRevision`                                  |

## Non-goals

- No brush or CSG implementation here.
- No parallel debug/smoke mesh path.
- No server-side mesh processing.
