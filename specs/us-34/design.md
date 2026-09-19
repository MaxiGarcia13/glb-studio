# US-34 — Design (created-model skinning MVP)

## Goal

One reliable path: **create-group armature → Bone skeleton + rigid-skinned meshes**, then reuse imported animation UX (US-31 helper/outliner, mixer, export).

## Locked decisions (see requirements)

- Entry: library model **⋯ → Skin model**
- After skin: freeze create tools; `source → imported`
- No groups: disable (no heuristic)
- Clips: drop mesh-object owned tracks
- Weights: rigid only

## Pipeline

```text
Created model (createGroup tree + stamped meshes)
        │
        ▼
1. Snapshot / clone scene (failure must not destroy original)
2. Map each createGroup → Bone (same names; parent links preserved). A create group named `Armature` becomes a container `Group` (not a skeleton bone), matching US-33 kit export.
3. For each stamped mesh under a joint:
     - Build SkinnedMesh (or convert BufferGeometry + skinIndex/skinWeight)
     - Rigid weights: all vertices → parent bone index (weight 1)
4. Assemble Skeleton + bind matrices (capture bind pose)
5. Replace library entry scene; set source: 'imported'
6. Drop owned clips with mesh / create-part object tracks for that model
7. bump revision / re-frame viewport; create toolbar hides (source !== 'created')
```

## Domain ownership

| Concern                             | Module                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Detect skinnable created model      | `create/domain/` (`canSkinModel` + disabled reason)                                                                  |
| Build bones from create groups      | `create/domain/` (group walk)                                                                                        |
| Rigid bind / SkinnedMesh build      | `create/domain/skinning/` (new)                                                                                      |
| Gate SkeletonHelper / bone outliner | Shared `isSkinnedLibraryModel(model)` — true for `source === 'imported'` with usable skeleton (covers post-skin + US-33) |
| UI action                           | `LibraryModelActions` ⋯ item; busy/disabled from `canSkinModel`                                                      |
| Export                              | Existing `packModelGlb` once scene is skinned                                                                        |

Avoid hardcoding Mixamo prefixes; bone names come from the user’s create-group names (Block robot already uses Hips / Spine / … — good for later retarget).

## UI

- **Skin model** on the focused created model’s library **⋯** menu
- Disabled reason string (mirror `getGroupPartsAvailability` pattern)
- Progress: sync is fine for MVP (robot-scale meshes); if slow, one busy state on the menu item / action
- After success: short muted note optional — not required; create toolbar disappears because `source !== 'created'`

## Edge cases

| Case                   | Behavior                                        |
| ---------------------- | ----------------------------------------------- |
| Already skinned        | Disable “Already skinned”                       |
| No create groups       | Disable “Add create groups before skinning”     |
| No parts               | Disable with clear reason                       |
| Parts not under groups | Parent to root bone or skip with warning count  |
| Multiple roots         | One skeleton from Armature/Hips root; document  |
| Skin fails mid-way     | Discard clone; original created model unchanged |

## Relation to US-33

US-33 shipped a **finished** skinned GLB for beginners (`/kits/block-robot.glb`). US-34 lets users **author** then skin. QA: compare bone count / helper on a user-skinned created model to the US-33 asset (mesh Block robot From kit entry was removed).

## Fold into current on ship

- Replace out-of-scope “Bones, skinning on created models” with “Weight paint / soft auto-weights / advanced rigging deferred”
- Document `isSkinnedLibraryModel` and Skin action in design
- CHANGELOG **US-34**; delete this folder
