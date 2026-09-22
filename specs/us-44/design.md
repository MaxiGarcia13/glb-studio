# US-44 — Cut holes (design)

## Approach

1. **CSG adapter** (`create/adapters/boolean-csg.ts` or similar)
   - Evaluate browser libraries at kickoff (e.g. `three-bvh-csg`, Manifold.wasm). Pick one; document license + bundle cost in design amendment.
   - API: `subtract(targetGeo, cutterGeoWorldMatrix, targetMatrix) → BufferGeometry` in a consistent space (prefer target local).
   - Always compute world → target-local for cutter before CSG.

2. **UX flow (recommended MVP)**
   - Select target → **Cut hole** enables “cutter mode”: spawning a default cylinder as a temporary part parented under the model (or marked `userData.cutter`).
   - User transforms cutter with Edit until satisfied.
   - **Cut** runs subtract; on success: assign result to target, bake/crafted, delete cutter, push undo.
   - **Cancel cutter** deletes cutter without modifying target.
   - Alternative (if simpler): user multi-selects target + any overlapping part as cutter, then Cut — document which is shipped.

3. **Undo**
   - Snapshot target attribute buffers before cut + cutter clipboard node.
   - Undo: restore target geo + re-instantiate cutter; Redo: re-apply result (store after buffers too).

4. **Validation**
   - Require volume intersection AABB before running CSG.
   - If result has zero triangles or throw → user-visible error.

5. **Post-cut**
   - Recompute normals; bump revision.
   - Optional tip: use US-42 Smooth on the rim (not auto).

6. **Scope carve at kickoff**
   - Soften `current` out-of-scope “boolean mesh fuse” to: full Blender boolean suite excluded; **created-model subtract (US-44) and union (US-45)** allowed when those USs ship.

## Non-goals

- No self-union cleanup beyond what the library returns.
- No hole-on-skinned meshes.
- No CAD-quality fillets inside the hole (Smooth brush afterward).
