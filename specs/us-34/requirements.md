# US-34 — In-editor skinning for created models (MVP)

Delta to turn **created** models (empty + mesh kits with create-group armatures) into **skinned** characters inside the editor. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23/24/26/27 (create parts + groups), US-31 (bone UI once skinned). **Improved by:** US-33 (reference skinned kit for QA / naming).

**Status:** Not started — do not implement until explicitly kicked off. Prefer **US-33 first**.

## Story

As an editor user building a character from parts (or the mesh Block robot), I can **skin** my model so limbs bend with a real skeleton, I see bones in the preview, and I can play / export skeletal animations — without leaving the editor for Blender.

## MVP scope (locked intent)

**In:** one-shot **Skin model** action that:

1. Builds a `Bone` hierarchy from the model’s **create-group** tree (or a documented fallback if no groups)
2. Converts stamped part meshes into **skinned** geometry with **auto weights** (MVP: rigid — each part 100% to its parent joint / nearest bone)
3. Switches the model onto the skinned / imported-capable path so US-31 helper + bone outliner apply
4. Preserves bind pose; exports as a skinned GLB

**Out of this MVP:** interactive weight painting, multi-mesh merge topology tools, automatic Mixamo retarget of arbitrary clips onto the new skeleton (beyond existing US-6 if names align), cloth, facial rigs.

## Acceptance

- [ ] Focused **created** model with at least one create-group joint (or explicit “skin from parts” rules in design) offers **Skin model** (File menu and/or create toolbar / model actions — lock placement at kickoff)
- [ ] Action is disabled with a clear reason when prerequisites fail (e.g. no parts; already skinned)
- [ ] On success: scene has a usable `SkinnedMesh` + `Skeleton`; `source` becomes `imported` **or** a new `source: 'skinned-created'` that still enables SkeletonHelper + bone outliner + skeletal clip validation (document one approach in design; prefer extending helper/outliner gates over inventing a third UX unless needed)
- [ ] Viewport shows `SkeletonHelper` while the model is previewed
- [ ] Library shows **bone outliner** (bones then owned clips); part outliner no longer claims to be the joint tree for posing (parts may remain as visual only or be replaced — design picks; MVP may hide create-part edit tools after skin)
- [ ] User can select bones and use Edit / Hold Pose with an owned clip on that skeleton
- [ ] Export packs a skinned GLB that re-imports as `imported` with bones intact
- [ ] Undo is **not** required (US-10); failed skin leaves the previous created scene intact (transactional: mutate a clone, swap on success)
- [ ] Mesh-only models **without** a group armature: either blocked with copy, or use a minimal auto-armature rule documented in design (kickoff choice)
- [ ] Modern house / prop kits are not required to support Skin (may stay disabled)
- [ ] Specs `current/` out-of-scope line “Bones, skinning… on created models” is revised on ship to allow this MVP

## Out of scope (defer)

- Weight paint brush / heat-map UI
- Soft automatic weights (Blender-style envelope) beyond simple rigid or one documented heuristic
- Generating a skinned kit GLB offline (that’s US-33 content)
- Full humanoid retarget wizard beyond US-6
- Skinned morph targets (US-8)
- Collaborative / durable undo (US-10)

## Open product choices (lock at kickoff)

1. **Entry point** — File menu vs model ⋯ vs create toolbar
2. **After skin** — Keep editable create parts vs freeze to skinned-only
3. **No-groups models** — Disable vs auto single-bone / chain heuristic
4. **`source` flag** — Flip to `imported` vs new `skinned-created`
5. **Clip strategy** — Empty owned library after skin vs attempt to remap any existing owned mesh tracks (likely drop mesh tracks; document)
