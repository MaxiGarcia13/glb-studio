# US-34 — In-editor skinning for created models (MVP)

Delta to turn **created** models (empty + mesh kits with create-group armatures) into **skinned** characters inside the editor. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23/24/26/27 (create parts + groups), US-31 (bone UI once skinned). **Improved by:** US-33 (shipped skinned Block robot kit for QA / naming).

**Status:** Kicked off — product choices locked; implement per [`tasks.md`](./tasks.md).

## Story

As an editor user building a character from parts (or the mesh Block robot), I can **skin** my model so limbs bend with a real skeleton, I see bones in the preview, and I can play / export skeletal animations — without leaving the editor for Blender.

## MVP scope (locked intent)

**In:** one-shot **Skin model** action that:

1. Builds a `Bone` hierarchy from the model’s **create-group** tree
2. Converts stamped part meshes into **skinned** geometry with **rigid auto weights** (each part 100% to its parent joint / nearest bone) — **no paint UI**
3. Switches the model onto the imported / skinned path so US-31 helper + bone outliner apply
4. Preserves bind pose; exports as a skinned GLB

**Out of this MVP:** interactive weight painting, multi-mesh merge topology tools, automatic Mixamo retarget of arbitrary clips onto the new skeleton (beyond existing US-6 if names align), cloth, facial softs, soft/envelope auto-weights.

## Locked product choices (kickoff)

| Choice               | Decision                                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry point**      | Library model **⋯** → **Skin model** (same menu as Rename / Replace). Not File menu; not create toolbar.                                                                                     |
| **After skin**       | **Freeze** — hide create toolbar + part outliner; bone outliner + owned clips only. No part-edit paths left live.                                                                            |
| **No-groups models** | **Disable** with clear reason (e.g. “Add create groups before skinning”). No auto-armature heuristic. House / prop kits stay disabled.                                                       |
| **`source` flag**    | On success, set **`source: 'imported'`** (same as US-33 skinned kit). No new `skinned-created`. Gate helper/outliner via shared `isSkinnedLibraryModel` that covers imported skinned scenes. |
| **Clip strategy**    | **Drop** owned clips that target mesh / create-part object paths; leave the model’s owned library empty (or skeletal-ready) for new clips. Do not remap mesh tracks onto bones in MVP.       |
| **Weights**          | **Rigid only** — weight 1 to parent bone; no paint UI in this US.                                                                                                                            |

## Acceptance

- [ ] Focused **created** model with at least one create-group joint offers **Skin model** on that model’s library **⋯** menu
- [ ] Action is disabled with a clear reason when prerequisites fail (e.g. no create groups; no parts; already skinned; not a created model)
- [ ] On success: scene has a usable `SkinnedMesh` + `Skeleton`; `source` is `imported`; SkeletonHelper + bone outliner + skeletal clip validation apply
- [ ] Viewport shows `SkeletonHelper` while the model is previewed (when Show bones is on)
- [ ] Library shows **bone outliner** (bones then owned clips); create toolbar and part outliner are gone for that model
- [ ] User can select bones and use Edit / Hold Pose with an owned clip on that skeleton
- [ ] Export packs a skinned GLB that re-imports as `imported` with bones intact
- [ ] Undo is **not** required (US-10); failed skin leaves the previous created scene intact (transactional: mutate a clone, swap on success)
- [ ] Mesh-only models **without** a group armature: blocked with disabled reason copy
- [ ] Modern house / prop kits are not required to support Skin (stay disabled via no-groups / prerequisites)
- [ ] Specs `current/` out-of-scope line “Bones, skinning… on created models” is revised on ship to allow this MVP

## Out of scope (defer)

- Weight paint brush / heat-map UI
- Soft automatic weights (Blender-style envelope) beyond rigid
- Generating a skinned kit GLB offline (that’s US-33 content)
- Full humanoid retarget wizard beyond US-6
- Skinned morph targets (US-8)
- Collaborative / durable undo (US-10)
- Keeping create-part edit tools after skin
- Auto-armature for models with no create groups
