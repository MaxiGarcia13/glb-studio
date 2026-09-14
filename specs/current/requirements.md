# Requirements — current

Living product contract for the **GLB Character & Animation Editor**.

## Product summary

Web editor with a full-screen 3D viewport and a collapsible sidebar. Users load one or more model GLBs (several can be previewed at once), manage nested model-owned and shared animation clips, play and edit them (trim, speed, keyframes, weighted blend + bake, bind pose, whole-model move), and download a zip of per-model GLBs plus animation-only files.

**Stack:** Astro shell + React island; React Three Fiber + drei + Three.js.

## User stories

### US-1 — Model load & viewport

As an editor user, I can upload a model and view it in a full-screen 3D viewport.

**Acceptance**

- [x] User can upload one `.glb` or `.gltf` that contains a skinned mesh and skeleton
- [x] Model appears in a full-screen R3F viewport with orbit / pan / zoom
- [x] Empty state when no model is loaded; clear error when load fails or skeleton is missing
- [x] Sidebar chrome is present and collapsible (shell may be minimal until later US)

### US-2 — Animation library & playback

As an editor user, I can import animation files into a clip library and play them on the loaded character.

**Acceptance**

- [x] User can upload multiple separate `.glb` / `.gltf` files; their clips populate an animation library
- [x] Sidebar library lists each clip with Replace (re-pick file for that entry) and Remove
- [x] Active clip is selected from the Animations library list (same pattern as models); clicking the selected clip again clears to T-pose / bind pose when a model is loaded
- [x] Loading or selecting a model does **not** auto-select an animation (embedded clips register as owned; T-pose until the user picks a clip)
- [x] When a **shared** clip is selected, each previewed model plays that shared clip unless it owns a **ready** clip with the same display name — then it plays the owned clip
- [x] Playback controls: Play, Pause, Stop, loop toggle
- [x] Timeline scrubber stays tied to `THREE.AnimationMixer` time
- [x] Clips that do not match the character skeleton (missing tracks / unknown bones) show a user-visible error — no silent retargeting

### US-3 — Clip trim & time scale

As an editor user, I can shorten a clip and change playback speed.

**Acceptance**

- [x] Start Time / End Time inputs trim the **working** copy of the active clip into a `[start, end]` window (track `trim` + time shift + duration on a clone — `AnimationClip.trim()` is a no-arg internal helper in three 0.185)
- [x] Trim always clones first so the pre-trim clip remains recoverable in the session
- [x] Speed multiplier slider stores `timeScale` on the **active** clip and drives live playback for that clip only
- [x] Export bake behavior for time scale is defined in design and followed when US-5 ships

### US-4 — Keyframe edit

As an editor user, I can pause on the timeline, move a selected bone/mesh, and save a keyframe at that time.

**Acceptance**

- [x] User can pause at an arbitrary timestamp (scrub or pause during play)
- [x] Raycast selects a bone or mesh; TransformControls move the selection
- [x] “Hold Pose to End” and “Restore Pose” appear in the preview only after the selection’s local pose has been edited (TransformControls); hold captures local position / rotation / scale
- [x] Hold finds or creates the matching `VectorKeyframeTrack` / `QuaternionKeyframeTrack` on the **active** clip and writes a plateau from the clip-local playhead through clip duration so the pose holds for the rest of the animation; timestamp is timeline playhead (`[0, duration]`), not raw accumulated `mixer.time`. Re-edit later by scrubbing and holding again
- [x] Restore discards the unsaved gizmo edit and re-applies the active clip at the current playhead

### US-5 — Zip export

As an editor user, I can download a zip of each model and of each animation as separate files.

**Acceptance**

- [x] “Download” uses `GLTFExporter` and builds a zip in the browser — no server round-trip
- [x] Zip contains one `{model}.glb` per loaded model: that model’s scene plus that model’s **owned** ready clips and **shared** clips that validate against that skeleton (skip conflicted shared; never pack another model’s owned clips)
- [x] Zip contains one `{clip}.glb` per **shared** library clip that has a working `AnimationClip` — animation-only, no mesh (owned clips ship only inside their model GLB)
- [x] Each clip’s stored `timeScale` is baked into that clip’s exported track times / duration per design
- [x] Filename collisions inside the zip get a numeric suffix
- [x] Download is disabled or errors when there is nothing to pack; exporter failure does not download a partial zip

### US-11 — Model library

As an editor user, I can keep several character GLBs in the session and choose which ones the viewport shows.

**Acceptance**

- [x] User can upload multiple `.glb` / `.gltf` files that each contain a skinned mesh and skeleton; they populate a model library
- [x] Sidebar library lists each model nested under **Models** with iconized Replace / Remove / Rename (and Animation / Retarget when applicable — US-19)
- [x] Multiple models can be **previewed** at once (US-20); one model is **focused** (`activeModelId`) for gizmo, transport, and Settings XYZ
- [x] Removing a model deletes its owned clips; if it was focused, focus moves to another previewed model, or empty state if none remain
- [x] Owned clip import still requires a model in context; Shared Upload does not (US-19)

### US-13 — Selection name overlay

As an editor user, when I click a bone or part of the model, I can see its name in a floating label on the preview so I know what is selected.

**Acceptance**

- [x] When a bone or mesh is selected via raycast selection, a floating label on the preview shows that object’s `Object3D.name`
- [x] The label updates when the selection changes and is hidden when there is no selection
- [x] The overlay is non-interactive (`pointer-events-none`) and does not block orbit, picking, or the transform-mode toolbar

### US-14 — Viewport general settings (axes)

As an editor user, I can show or hide the world axes and change how far the metre rulers extend from the Settings sidebar.

**Acceptance**

- [x] Settings sidebar (`editor-settings-sidebar`) has a **General** section above Animation
- [x] General includes a checkbox to show/hide world XYZ axes (and X/Y metre rulers)
- [x] General includes a numeric control for axes length in metres
- [x] Toggling visibility mounts/unmounts axes in the viewport immediately
- [x] Changing length updates `axesHelper` and X/Y rulers live
- [x] Defaults match prior behavior: axes visible, length `10`
- [x] Settings are session-only (no persistence across reloads)

### US-12 — Rename library entries

As an editor user, I can rename a model or animation in the library so labels and exported filenames match what I intend.

**Acceptance**

- [x] User can rename any model library entry; the new name appears in the sidebar and as the previewed-row label
- [x] User can rename any clip library entry (ready or errored); the new name appears in the sidebar, the active-clip selector, and related chrome that shows `ClipEntry.name`
- [x] Entry `id` stays stable across rename (selection, replace, retarget, and mixer bindings must not break)
- [x] Clip rename updates `ClipEntry.name` and, when present, `AnimationClip.name` on both the working `clip` and `sourceClip` so exported GLB animation metadata matches the library label
- [x] Model rename updates `ModelEntry.fileName` (the field used for display and zip naming)
- [x] Clip `sourceFile` stays the original import file name (provenance); rename does not rewrite it
- [x] Empty or whitespace-only names are rejected; the previous name is kept
- [x] Zip export (US-5) uses the renamed values for `{model}.glb` / `{clip}.glb` basenames (existing extension strip + collision suffix still apply)
- [x] Rename is keyboard-operable and labelled (NFR-4)

### US-6 — Cross-rig retargeting

As an editor user, I can apply an animation authored for a different rig to my loaded character via an explicit retarget mapping.

**Acceptance**

- [x] User can open a retarget flow when imported clip tracks do not match the character skeleton
- [x] Mapping is explicit (auto-suggest allowed; silent remap without confirmation is forbidden)
- [x] Vendor bone prefixes (e.g. Mixamo) are handled only via a documented registry / mapping table — no hardcoded one-off string hacks in playback code
- [x] Successfully retargeted clips become playable working clips in the library
- [x] Unmapped clip bones may be left blank — Apply drops those tracks; Apply requires at least one mapped bone; other failures leave a clear error and do not corrupt the character pose
- [x] Retarget mapping UI opens in a modal (Settings aside stays available)
- [x] After switching the previewed model, clips that no longer match show Fix / Retarget for that character
- [x] **This model** apply on a **shared** (or other-owned) clip: new ready clip owned by the target model with the **same name**; shared/source original kept
- [x] **This model** apply on a clip **already owned** by the target model: remap **in place** (same entry id and name; broken entry becomes ready — no duplicate owned row)
- [x] Remapped `AnimationClip` / library display name stays the source name (no `(retargeted)` suffix) so same-name ownership can detect a fix
- [x] When a model already owns a **ready** clip with the same name as a mismatched shared clip, that shared mismatch is not treated as Needs retarget for that model
- [x] **All models** apply: remap the shared clip in place; normalize bones only on models that resolve the map; incompatible models stay conflicted (partial success — no fail-entire-apply)
- [x] Apply UI offers an explicit This model / All models choice (no silent all-model normalize)

### US-17 — Retarget position scale (rest-pose length ratio)

As an editor user, when I retarget a clip onto a character whose skeleton uses different units or overall size, Apply uses a rest-pose length ratio so remapped motion stays roughly character-sized instead of collapsing or exploding the mesh.

**Acceptance**

- [x] On **Apply Retarget**, a single **rest-pose length ratio** is derived from mapped source→target bone pairs and used when remapping hips positions (with US-18)
- [x] Ratio is `median(‖target bind local position‖ / ‖source bind local position‖)` over mapped pairs where both lengths exceed a small epsilon; non-hips quaternions and scales are unchanged by the ratio
- [x] Source bind lengths are captured when the clip file is loaded (from that GLB’s skeleton) and stored on the library entry; target bind lengths come from the previewed character scene at Apply
- [x] If the ratio cannot be computed (no usable pairs), Apply fails with a clear error and does not write a clip or rename model bones
- [x] Unmapped / skipped bones (US-6) stay dropped; name remap and This model / All models scopes are unchanged
- [x] Verified with Mixamo-style cm clip (`body-block`) on metre Mixamo character (`Y Bot`): after retarget the skinned mesh stays roughly character-sized (no shard / explode)

### US-18 — Retarget hips bind-frame

As an editor user, when I retarget a Mixamo-style clip whose source GLB has an armature axis offset onto a Y-up character, the character stands roughly upright on the target’s rest height instead of lying in the floor or floating.

**Acceptance**

- [x] On **Apply Retarget**, remapped `.position` tracks are kept **only for the hips/root bone**; other `.position` tracks are dropped so limbs use the target bind offsets
- [x] Hips `.position` keyframes use **delta-from-bind**: `p' = targetBind + R_tgtParent⁻¹ · R_srcParent · ((p − sourceBind) · ratio)` (US-17 ratio on the delta only)
- [x] Hips `.quaternion` keyframes are rebased source parent bind → target parent bind; other quaternion / scale tracks stay name-remapped only
- [x] Source bind frames (per-bone local position + parent world quaternion at rest) are captured on clip load; target frames come from the previewed scene at Apply
- [x] Same-hierarchy source/target (matching parent bind orientations) leaves hips deltas unchanged aside from US-17 scale
- [x] If hips cannot be resolved for rebase while position tracks exist, Apply fails clearly and does not write a clip or rename model bones
- [x] Verified with `body-block` → `Y Bot`: roughly human-sized, upright, and not floating above the grid

### US-15 — Edit / Move tools + bind-pose save

As an editor user, I can choose Edit or Move in the preview, pose bones/meshes or place the whole model on world X/Y/Z with or without an animation, and Save or Restore to confirm or discard.

**Acceptance**

- [x] When a model is loaded, preview chrome shows mutually exclusive **Edit** (`CursorIcon`) and **Move** (`MoveIcon`) tool toggles
- [x] **Edit:** raycast selects a bone or mesh; TransformControls support translate / rotate / scale (existing W / E / R toolbar when selected); works with **no** imported / active clip
- [x] **Move:** TransformControls translate the active model root on **world X / Y / Z** only; W / E / R toolbar is hidden; raycast does not switch selection away from the root
- [x] After a gizmo edit (either tool), **Save** and **Restore** appear in the preview until the user confirms or discards
- [x] **Edit + no active clip — Save:** commits the selection’s local TRS as the model bind pose (persists on the scene graph and in exported `{model}.glb`) **and** rebases that node’s tracks in **every** library clip by the pre-edit → current TRS delta (so later / existing animations keep the structural edit; the user does not re-hold per clip). The same accumulated delta is applied when importing or replacing clips while that model is active, and again after US-6 retarget remaps tracks onto the character bones
- [x] **Edit + active ready clip — Save:** keeps US-4 Hold Pose to End (plateau on the working clip from playhead to clip end)
- [x] **Move — Save (no active clip):** commits the model root translation as the model rest / bind root (persists on the scene graph and in exported `{model}.glb`); never writes animation keyframes
- [x] **Move — Save (active ready/draft clip on that model):** stores the model root translation on **that clip for that model only** (`ClipEntry.rootPositionByModelId[modelId]`); seeks the playhead to **t=0** so the animation starts under that root; other models, other clips, and the T-pose rest root are unchanged; never writes animation keyframes
- [x] **Selecting a clip** applies that clip’s stored root position **for the playing model** (or the rest root when unset) and shows the clip at **t=0**; clearing the clip restores the rest / bind root via T-pose
- [x] **Settings / Move root edit with an active clip:** preview samples the clip at t=0 under the edited root (pending Save) so the animation start pose matches the root — only the focused model’s scene is moved
- [x] **Restore:** discards the unsaved gizmo edit (with an active clip in Edit mode, re-applies the clip at the playhead; otherwise restores the pre-edit TRS snapshot)
- [x] Switching Edit ↔ Move while dirty auto-Restores, then switches tools
- [x] Changing selection (pick another bone/mesh or clear) while dirty auto-Restores the pending edit on the previous object, then updates selection — preview TRS matches the discarded edit
- [x] Settings sidebar (`EditorSettingsSidebar` General) shows live **editable X / Y / Z** fields for the **model root position**, available whenever a model is loaded — **independent of Edit / Move tool**. Committing a number updates `scene.position`, marks dirty as a model-root edit, and uses the same Save / Restore path as Move-mode gizmo edits. With an active clip, Save scopes that position to the clip; without a clip, Save updates the model rest root. (Bone/mesh local position is edited via the Edit gizmo, not these fields.)
- [x] Clicking the selected Animations list row (or otherwise clearing the active clip) restores the model’s current bind / rest pose in the preview so Edit-without-clip works without leaving an animation frozen on the last frame

### US-21 — Whole-model rotate / scale + Settings root rotation

As an editor user, when Move is selected I can rotate and scale the whole model, and I can set model-root rotation XYZ (0–360°) in Settings with the same Save path as root position.

**Acceptance**

- [x] **Move** supports translate / rotate / scale on the model root (world); W / E / R toolbar visible while Move is active
- [x] Settings shows live editable **rotation X / Y / Z** (degrees, 0–360) for the model root when a model is loaded; values reflect the scene root on load / focus
- [x] Rotation edits mark dirty as model-root and share Save / Restore with Move / position XYZ
- [x] Save with no clip commits root TRS to rest pose; Save with an active clip stores position + rotation on that clip per model; selecting the clip reapplies them

### US-7 — Multi-clip blending

As an editor user, I can create a new animation from scratch or use an uploaded clip, preview a weighted blend with other library clips, and Bake when I want that mix written into the active clip.

**Acceptance**

- [x] User can start a **New animation** from the Library (`PlusIcon`) — creates an editable draft from scratch
- [x] Active animation is selected from the **Animations list** (same pattern as models)
- [x] Clicking a currently selected animation unselects it to T-pose
- [x] Draft and uploaded clips support Start/End, playback speed, playback, and keyframe edits on the active clip
- [x] Settings **Blend** is a collapsible; expanded form has partner select, weight, **Bake**, and **Reset**
- [x] Blend is viewport-only until Bake; Bake writes into the active clip and resets the form; Reset clears without writing
- [x] Unsaved pose edits discard on reselect; Hold Pose to End commits into the active clip
- [x] Export: discrete library clips only — live `blendClipId` / `blendWeight` are not packed; Bake must run first for a mix to appear in the zip (US-5)

### US-19 — Nested library + clip ownership

As an editor user, I manage models and animations in a nested library: each model owns its clips, shared animations stay in a common pool, and retarget can fix one model or partially succeed across many.

**Acceptance**

- [x] Library sidebar is nested: **Models** collapsible (upload) → each **model** collapsible + sibling **Shared Animations** collapsible
- [x] Model header shows **ModelIcon** next to the name; actions are icons: Retarget (when conflicted), **Animation** (add), Edit (rename), Replace, Remove
- [x] Shared Animations header shows **AnimationIcon**; actions: Upload, New animation
- [x] Shared **Upload** is always available — does not require a loaded or selected model
- [x] Each clip row shows **AnimationIcon** next to the name; Remove (and Retarget when conflicted) as icons
- [x] Clips have ownership: `ownerModelId: string | null` (`null` = shared; otherwise listed only under that model)
- [x] Import / New from Shared → shared (`ownerModelId: null`); create / import under a model → owned by that model
- [x] **Add animation** via model-header **AnimationIcon**: modal offers **Create new**, **Import** (files → owned by that model), and **Add existing** (selector of cloneable clips, excluding already owned / same-name under that model) → Apply → model-owned **clone** (new id); source unchanged
- [x] Model upload / replace: embedded GLB animations are registered as **owned** by that model (`ownerModelId` set); they never appear under Shared Animations
- [x] Removing a model deletes its owned clips
- [x] **Retarget → This model:** shared/other source → new remapped ready owned clip (same name, source kept); owned-by-target source → remap in place
- [x] **Retarget → All models:** remap shared clip in place; normalize bones on models that can resolve; **partial success** — incompatible models stay conflicted (no fail-entire-apply)
- [x] Conflict (skeleton mismatch) surfaces as Needs retarget / amber treatment relative to the model in context (focused for Shared; that model for owned rows), except when that model already owns a ready clip with the same name
- [x] Model-header Retarget enabled when any clip is conflicted for that model; with multiple conflicts, modal opens a **clip picker step** before the bone map; clip-row Retarget skips the picker
- [x] Export per model packs that model’s owned clips + shared clips that validate for it; skips conflicted shared

### US-20 — Multi-model preview + per-model clips

As an editor user, I can preview two or more models at once, each playing a different owned animation; selecting a shared animation plays that clip on models that lack a same-name owned ready clip, and those models’ own same-name clip otherwise.

**Acceptance**

- [x] Viewport can show more than one loaded model at a time (eye toggle; new loads join the preview; camera frames the combined bounds)
- [x] Each model can have its own selected **owned** clip playing
- [x] Selecting a **shared** clip clears per-model owned selections; each model plays that shared clip **unless** it already owns a ready clip with the same display name (then it plays the owned one)
- [x] Selecting an owned clip under a model does not clear other models’ owned selections
- [x] Loading or selecting a model does **not** auto-select an animation (T-pose until the user picks a clip)
- [x] Playback / mixer works per model (no single-mixer-only limitation for multi-model)

### US-16 — FBX import via convert API

As an editor user, I can upload a `.fbx` model or animation file and have it converted to GLB so it loads like any other library asset.

**Acceptance**

- [x] Model import and Replace accept `.fbx` in addition to `.glb` / `.gltf`
- [x] Clip import and Replace accept `.fbx` in addition to `.glb` / `.gltf`
- [x] `.fbx` files are converted via `POST /api/v1/fbx-to-glb` **before** skeleton / clip validation; `.glb` / `.gltf` stay local (no convert hop)
- [x] After convert, library entry names use `{basename}.glb` so rename and zip export stay unchanged
- [x] Convert / oversize / non-fbx failures are user-visible (same surfaces as a bad GLB: model `error`, clip failed entry)
- [x] Convert API is a Vercel Node serverless function (`@astrojs/vercel`, not Edge); request body cap matches Vercel’s payload limit (typically 4.5MB)

## Post-MVP user stories

Deltas exist under `specs/us-8/` … `specs/us-10/`. Not started; do not implement until explicitly kicked off.

### US-8 — Morph-target editing

As an editor user, I can adjust morph target influences and save them as animation keyframes.

**Acceptance**

- [ ] Morph list + influence sliders when morphs exist
- [ ] Live updates; save morph keyframes at `mixer.time` on the active clip
- [ ] Empty state without morphs; export includes morph tracks when present

### US-9 — Graph / curve keyframe UI

As an editor user, I can inspect and edit keyframe curves for tracks on the active clip.

**Acceptance**

- [ ] Track list (filterable by selection); edit / add / delete keyframes
- [ ] Edits update the working clip and mixer; interpolation visible where supported

### US-10 — Full undo / redo

As an editor user, I can undo and redo animation edits within the session.

**Acceptance**

- [ ] Undo / Redo UI + shortcuts for discrete clip mutations (trim, keyframes, …)
- [ ] Per-session stack; mixer never left on a stale clip; integrates with or replaces US-3 pre-trim restore

## Non-functional requirements

- **NFR-1 Modular domains:** Logic lives under `src/modules/<domain>/` (`editor-shell`, `viewport`, `animation`, `export`, `import`); pages stay thin
- **NFR-2 Layering:** `services/` = HTTP; `domain/` = business logic; `utils/` = shareable helpers; `adapters/` = external boundaries + mappers; `actions/` = store commands. No R3F / Tailwind / GSAP in `services/` / `domain/` / `utils/` (`three` OK for 3D code)
- **NFR-3 Island boundary:** Canvas and editor interactivity hydrate as a client React island; Astro owns the static shell
- **NFR-4 Accessibility:** Sidebar controls are keyboard-operable and properly labelled
- **NFR-5 Asset contract:** Bone-name mismatch is an explicit error; no hardcoded vendor prefixes without a registry

## Out of scope (still excluded)

- Material / texture editing
- Server accounts (FBX convert via US-16 is the allowed server round-trip; no user accounts)
- Collaborative editing / durable undo across reloads
- Full NLA strip editorial beyond US-7 blend/cross-fade
- FBX larger than Vercel’s function payload (typically 4.5MB) until a later blob / chunked upload
