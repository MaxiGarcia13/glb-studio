# Starter kits — asset contract

Maintainer notes for files under `public/kits/`. Not a user-facing product surface.

## Block robot (`block-robot.glb`)

Skinned starter for **From kit → Block robot** (US-33). Generated offline from the maintainer mesh recipe (`BLOCK_ROBOT_MESH_RECIPE` in `src/modules/create/domain/kits/block-robot.ts`); committed here for a stable URL (`/kits/block-robot.glb`). That recipe is **not** a From kit entry.

Regenerate:

```bash
npm run kits:block-robot
```

### Skeleton

- **Root:** `Armature` (container). Bind-pose bones use **unprefixed** Mixamo-style local names (no `mixamorig:`).
- **Bone count:** 17 (no shoulders, toes, or fingers).

| Parent       | Bones                              |
| ------------ | ---------------------------------- |
| Armature     | `Hips`                             |
| Hips         | `Spine`, `LeftUpLeg`, `RightUpLeg` |
| Spine        | `Chest`                            |
| Chest        | `Neck`, `LeftArm`, `RightArm`      |
| Neck         | `Head`                             |
| LeftArm →    | `LeftForeArm` → `LeftHand`         |
| RightArm →   | `RightForeArm` → `RightHand`       |
| LeftUpLeg →  | `LeftLeg` → `LeftFoot`             |
| RightUpLeg → | `RightLeg` → `RightFoot`           |

Names match the mesh kit’s create-group joints and align with the Mixamo vendor adapter’s local/canonical keys (`Hips`, `LeftArm`, …) so US-6 retarget can suggest mappings when clip bones are Mixamo-prefixed.

### Mesh / skinning

- **Bind pose:** T-pose (arms horizontal along ±X).
- At least one `SkinnedMesh`; look matches the white/black/cyan block humanoid.
- MVP: **rigid** weights (each segment mesh 100% to its parent bone). Soft weights optional later.
- Scale: ~Y Bot height (~1.8 m). Approx: ~20 primitive segments; low-poly (roughly 1–5k tris depending on cylinder tessellation).

### Clips / root motion

- **No** embedded demo animations (bind / T-pose only).
- **No** locomotion root motion on `Hips` / Armature in the kit asset. Motion comes from imported / retargeted clips.

### License

Original first-party geometry and hierarchy (same aesthetic as the in-editor Block robot recipe). Licensed under the repository **Apache-2.0** license. Not a Mixamo / Adobe character download — only the **naming convention** is Mixamo-compatible for retarget.
