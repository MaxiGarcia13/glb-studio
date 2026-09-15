# US-23 — Create empty model + part edit

Delta for beginner-friendly model creation from scratch. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-11 (model library), US-15 (Edit + Save / Restore), US-5 (zip export).

**Status:** In progress — create flow + part edit + export packing done; remaining tasks are regression / manual verify.

## Story

As an editor user with little or no 3D experience, I can create a new empty model, add and tweak parts in the viewport, and download a GLB — without uploading a file or knowing about skeletons.

## Acceptance

- [x] Models library has a **New model** action (alongside Load) that **immediately** creates an empty `source: 'created'` model (no kit picker modal)
- [x] New model joins preview and becomes focused (same as a successful import); default name like `New model 1.glb`
- [x] Created models do **not** require a skinned mesh or skeleton; imported models still do
- [ ] Created models use metres, Y-up; parts sit on the ground when added (`y = 0` as appropriate)
- [ ] Parts are named meshes; selection name overlay shows those names
- [x] **Edit** tool + TransformControls move / rotate / scale parts; dirty **Save** / **Restore** follows US-15 (bind-pose style commit on the scene graph — no animation keyframes required)
- [x] When a part is selected on a created model, the create toolbar offers **color** and the Settings inspector shows **size** fields for that part kind; changes update the viewport live
- [x] User can **Duplicate** and **Delete** the selected part from the create toolbar (delete removes the mesh only, not the library model)
- [x] Zip export (US-5 / US-22 path) packs created model scenes as `{model}.glb` like any other model
- [x] Empty / first-run hint when a created model has no selection: short copy that points users to add / pick a part and use Edit

## Out of scope

- Kit picker / starter kits in the New model flow (presets are US-27 if wanted later)
- Freeform “add primitive” palette (US-24) — required to place first parts after empty create
- Grid / rotation snap (US-25)
- Parenting UI / part outliner (US-26)
- Image textures / PBR maps (US-28)
- Bones, skinning, Mixamo / retarget on created models
- Material / texture editing on **imported** characters
- Cloth simulation, sculpting, boolean mesh ops
