# US-34 — Design (created-model skinning MVP)

## Goal

One reliable path: **create-group armature → Bone skeleton + rigid-skinned meshes**, then reuse imported animation UX (US-31 helper/outliner, mixer, export).

## Pipeline

```text
Created model (createGroup tree + stamped meshes)
        │
        ▼
1. Snapshot / clone scene (failure must not destroy original)
2. Map each createGroup → Bone (same names; parent links preserved)
3. For each stamped mesh under a joint:
     - Build SkinnedMesh (or convert BufferGeometry + skinIndex/skinWeight)
     - Rigid weights: all vertices → parent bone index (weight 1)
4. Assemble Skeleton + bind matrices (capture bind pose)
5. Replace library entry scene; set source / flags for helper+outliner
6. Clear or migrate owned clips (MVP: drop mesh-object tracks that no longer apply; keep empty ready for new skeletal clips)
7. bump revision / re-frame viewport
```

## Domain ownership

| Concern                             | Module                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Detect skinnable created model      | `create/domain/`                                                                                                     |
| Build bones from create groups      | `create/domain/` or `animation/domain/` (prefer `create` for group walk, `animation` for skeleton helpers if shared) |
| Rigid bind / SkinnedMesh build      | `create/domain/skinning/` (new)                                                                                      |
| Gate SkeletonHelper / bone outliner | `viewport` / `editor-shell` — today `source === 'imported'`; extend predicate `isSkinnedLibraryModel(model)`         |
| Export                              | Existing `packModelGlb` once scene is skinned                                                                        |

Avoid hardcoding Mixamo prefixes; bone names come from the user’s create-group names (Block robot already uses Hips / Spine / … — good for later retarget).

## UI

- **Skin model** action with disabled reason string (mirror Group availability pattern)
- Progress: sync is fine for MVP (robot-scale meshes); if slow, one busy state on the button
- After success: short muted note in UI or status optional — not required

## Edge cases

| Case                   | Behavior                                        |
| ---------------------- | ----------------------------------------------- |
| Already skinned        | Disable “Already skinned”                       |
| No create groups       | Disable or kickoff heuristic                    |
| Parts not under groups | Parent to root bone or skip with warning count  |
| Multiple roots         | One skeleton from Armature/Hips root; document  |
| Skin fails mid-way     | Discard clone; original created model unchanged |

## Relation to US-33

US-33 ships a **finished** skinned GLB for beginners. US-34 lets users **author** then skin. QA: skin the mesh Block robot (if kept) and compare bone count / helper to US-33 asset.

## Fold into current on ship

- Replace out-of-scope “Bones, skinning on created models” with “Weight paint / soft auto-weights / advanced rigging deferred”
- Document `isSkinnedLibraryModel` and Skin action in design
- CHANGELOG **US-34**; delete this folder
