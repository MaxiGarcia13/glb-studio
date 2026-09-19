# US-33 — Skinned starter kit (Block robot GLB)

Delta so **From kit** can spawn a **pre-skinned** character with real bones (SkeletonHelper, bone outliner, skeletal clips) — without building in-editor skinning yet. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-27 (From kit), US-1 / US-11 (imported model path), US-31 (bone outliner + SkeletonHelper).

**Status:** Kicked off — product choices locked; implement per tasks.

**Pairs with:** [`US-34`](../us-34/) (in-editor skinning for created models). Ship **this first** for user-visible skinned kits.

## Story

As an editor user with little 3D experience, I can start from a **skinned** Block robot kit so I immediately see bones in the viewport, browse joints in the library, and play skeletal animations — like an imported Mixamo character — without leaving the From kit flow.

## Acceptance

- [ ] Kit registry supports a **skinned asset** kit kind (GLB URL / static import) in addition to today’s mesh+create-group recipes
- [ ] **From kit…** lists a skinned Block robot entry (label + one-line description); choosing it loads the skinned GLB into the model library
- [ ] The spawned model uses the **imported** path (`source: 'imported'`) — or an equivalent documented hybrid that still gets US-31 bone outliner + `SkeletonHelper` while previewed
- [ ] Viewport shows skeleton lines on the skinned kit model (same helper as other imported models)
- [ ] Library under that model shows **bones, then owned clips** (US-31 order); embedded GLB clips register as owned
- [ ] User can Edit-select bones, Hold Pose / playback / export like any other imported character
- [ ] Zip export packs the skinned kit model as a normal imported GLB (mesh + owned ready clips)
- [ ] **File → New model** and the mesh-only Modern house kit stay unchanged
- [ ] **Block robot** From kit entry is the skinned GLB only (previous mesh create-group recipe is not listed)
- [x] Asset contract is documented (bone naming convention, no embedded demo clips, approx poly/bone count, license) — [`public/kits/README.md`](../../public/kits/README.md)
- [ ] Load failure of the kit GLB shows a clear error; does not leave a half-empty library entry

## Out of scope

- In-editor auto-rig / weight painting (US-34)
- Converting a mesh Block robot in-session into skinned (US-34)
- Skinning the Modern house kit
- Marketplace / remote kit download
- Retarget UI changes (existing US-6 path is enough if bone names match registry)
- Demo / idle clips inside the skinned kit GLB (import / retarget remains the path)
- Listing the maintainer mesh recipe as a From kit entry

## Locked product choices (kickoff)

1. **Replace** — From kit lists a single **Block robot** (skinned asset). Mesh create-group recipe is maintainer-only for GLB regeneration, not a starter kit. Modern house + empty unchanged.
2. **Asset source** — Offline script generates a skinned GLB from the create-group recipe (rigid weights OK); commit the `.glb` under `public/kits/`. Script is maintainers-only (not shipped to users). Not generated at runtime in the browser.
3. **Starter clips** — Bind / T-pose only; **no** embedded demo clips in the kit GLB.
