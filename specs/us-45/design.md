# US-45 — Fuse / join parts (design)

## Approach

1. **Reuse CSG adapter** from US-44
   - `union(geometriesInCommonSpace[]) → BufferGeometry`.
   - If US-45 ships first, introduce the adapter here; US-44 subtract shares it.

2. **Selection → operands**
   - Resolve `$selection.objects` to stamped create parts (reject bones / imported).
   - **Primary** = last-clicked / active selection for material + name policy.
   - Parent of result: common parent if all share one; else model scene root (document).

3. **Transform bake**
   - Convert each part’s geometry to primary-local (or world then back) before union so TRS is correct.
   - Result mesh: identity-friendly local geo + primary world TRS (or keep primary Object3D and replace its geometry).

4. **Scene mutation**
   - Replace primary geometry with union result; set crafted; delete other operands.
   - Refresh rest-pose nodes for surviving mesh; bump revision.
   - Do **not** auto-create joints.

5. **Undo**
   - before: clipboard snapshots of all operand parts (with geometry if already crafted).
   - after: fused mesh snapshot.
   - apply undo = delete fused + restore operands (createScene-style ensureTrees).

6. **UI**
   - Create toolbar or context menu **Fuse** when ≥2 parts selected.
   - Short helper text about segment-then-joint workflow.
   - Busy state if CSG is slow on dense meshes.

7. **Seams**
   - Optional post-pass: US-42 Smooth along the old intersection (manual). No auto-smooth required in MVP.

## Non-goals

- No “Fuse and Skin” mega-action.
- No boolean intersect.
- No keeping operand history as non-destructive stack.
