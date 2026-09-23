# Requirements — current

Living product contract for **GLB Studio** (GLB character & animation editor).

## Product summary

Web editor with a full-screen 3D viewport, a Blender-style top **File / Settings** menu bar, and a collapsible sidebar. Users load one or more model GLBs (several can be previewed at once), **create empty models from scratch** and edit primitive parts (including hierarchy / outliner / Group), manage nested model-owned and shared animation clips, play and edit them (trim, speed, keyframes, weighted blend + bake, bind pose, whole-model move), and download a zip of per-model GLBs (or one GLB per editor **model group**) plus animation-only files.

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
- [x] Playback controls: Play, Pause, Stop, loop toggle (enabled when a clip is selected and a model is previewed — model focus not required)
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
- [x] Pose edits (TransformControls) mark dirty and **auto-commit** on gesture end (US-10); Hold Pose to End captures local position / rotation / scale — no Save / Restore pose chrome
- [x] Hold finds or creates the matching `VectorKeyframeTrack` / `QuaternionKeyframeTrack` on the **active** clip and writes a plateau from the clip-local playhead through clip duration so the pose holds for the rest of the animation; timestamp is timeline playhead (`[0, duration]`), not raw accumulated `mixer.time`. Re-edit later by scrubbing and holding again
- [x] Cancelling an in-progress dirty gesture uses Undo (flush then pop) — no Restore Pose control (US-10)

### US-9 — Track / key list keyframe UI

As an editor user, I can inspect and edit keyframe times and values for tracks on the active clip from the bottom preview bar.

**Acceptance**

- [x] Bottom preview bar switches **Timeline** (scrubber) vs **Tracks** (track list | key table); shared transport (play / pause / stop / loop) stays available in both modes; default mode is Timeline
- [x] Tracks mode lists tracks for the active ready clip; selecting a bone/part in Library / viewport filters the list to that node; selecting a track shows its key table
- [x] User can select a keyframe and edit its time and values; Add inserts at the playhead (nudges if a key already exists there); per-row delete keeps at least one key (Three.js cannot clone empty tracks)
- [x] Interpolation mode is visible per selected track; Discrete / Linear / Smooth where the track type allows (quaternion has no Smooth); Bezier out of scope
- [x] Key / interpolation edits publish a new working clip clone so the mixer rebinds on next play / scrub (same pattern as pose hold)
- [x] Settings Animation is trim / speed / blend only — no Keys panel

### US-5 — Zip export

As an editor user, I can download a zip of each model and of each animation as separate files.

**Acceptance**

- [x] **File → Export** packs with `GLTFExporter` in the browser for **GLB** (default) — no convert hop; optional **FBX** format packs the same units then converts each file via `POST /api/v1/glb-to-fbx` before zipping (US-36)
- [x] Zip contains one `{model}.glb` (or `.fbx` when Format is FBX) per loaded model: that model’s scene plus that model’s **owned** ready clips and **shared** clips that validate against that skeleton (skip conflicted shared; never pack another model’s owned clips). **Created** models pack the mesh scene plus **owned** ready clips (no shared-clip attach). **Created** models with **no stamped mesh parts** are omitted from the zip (empty New models are not exported)
- [x] Zip contains one `{clip}.glb` (or `.fbx`) per **shared** library clip that has a working `AnimationClip` — animation-only, no mesh (owned clips ship only inside their model file when not merging)
- [x] Each clip’s stored `timeScale` is baked into that clip’s exported track times / duration per design
- [x] Filename collisions inside the zip get a numeric suffix
- [x] Export is disabled or errors when there is nothing to pack; exporter / convert failure does not download a partial zip

### US-22 — Export modal (+ multi-model pack; superseded opt-in by US-26)

As an editor user, when I choose **File → Export** I can confirm the zip contents before packing. Multi-model one-file packing uses editor **model groups** (US-26); the former **Merge visible models** checkbox is removed.

**Acceptance**

- [x] **File → Export** opens an **Export** modal (does not pack immediately)
- [x] Modal shows a short summary of what will be packed; confirm builds the zip
- [x] Modal **Format** select: **GLB** (default on open) or **FBX** — whole zip uses that format; summary + zip default basename follow format (`glb-export` / `fbx-export`) (US-36)
- [x] Ungrouped **exportable** models pack as separate files (US-5); empty created models (no stamped mesh parts) are omitted
- [x] Each editor **model group** with ≥2 exportable members packs as **one** file via bone-prefixed merge (US-26); that file includes **each member’s owned ready clips** (tracks remapped to that model’s bone prefix) — no multi-character Scene bake / clip merge; shared clips still ship only as animation-only sidecars
- [x] Group GLBs stamp an editor manifest so re-import restores **group → models → per-model clips** (US-32) — FBX export does not guarantee the same round-trip
- [x] Filename collisions and no-partial-zip rules from US-5 still apply
- [x] Modal edits zip basename + per-group / per-model basenames; empty/invalid → defaults; extensions auto-applied for the selected format; animation files keep library names
- [x] Convert / oversize failures stay in the modal (busy spans pack + convert + zip; dismiss blocked while busy) (US-36)

### US-36 — Export format GLB | FBX

As an editor user, when I choose **File → Export** I can pick **GLB** (default) or **FBX** so the zip uses the chosen extension without changing pack rules.

**Acceptance**

- [x] Export modal **Format** control: GLB (default) / FBX; whole-zip format only
- [x] GLB path: in-browser pack → zip — no convert hop
- [x] FBX path: pack GLB units → `POST /api/v1/glb-to-fbx` per entry → zip of `.fbx` files; fail closed (no partial download)
- [x] Convert API is Vercel Node (`libassimp` WASM); ~4.5MB per-file body cap
- [x] Import (including FBX → GLB) unchanged when exporting GLB

### US-11 — Model library

As an editor user, I can keep several character GLBs in the session and choose which ones the viewport shows.

**Acceptance**

- [x] User can import multiple `.glb` / `.gltf` / `.fbx` files via **File → Import** (US-30 content routing); usable skinned mesh + skeleton files populate the model library as `imported`; mesh-only (non-skinned) GLBs populate as `created` (re-import of exported New models)
- [x] A GLB stamped as an editor **model group** (US-32) splits into member models + recreates the library group with owned clips nested under each model
- [x] Sidebar library lists each model nested under **Models** with iconized Replace / Remove / Rename (and Animation / Retarget when applicable — US-19)
- [x] Multiple models can be **previewed** at once (US-20); one model is **focused** (`activeModelId`) for gizmo and Settings XYZ (transport works with a selected clip even when no model is focused)
- [x] Removing a model deletes its owned clips; if it was focused, focus moves to another previewed model, or empty state if none remain
- [x] Owned clip import via model **Add animation** still requires a model in context; File Import animation-only files go to Shared without a model (US-19 / US-30)

### US-13 — Selection name overlay

As an editor user, when I click a bone or part of the model, I can see its name in a floating label on the preview so I know what is selected.

**Acceptance**

- [x] When a bone or mesh is selected via raycast selection, a floating label on the preview shows that object’s `Object3D.name`
- [x] The label updates when the selection changes and is hidden when there is no selection
- [x] The overlay is non-interactive (`pointer-events-none`) and does not block orbit, picking, or the transform-mode toolbar

### US-29 — Rename selected bone or mesh

As an editor user, I can rename the selected bone or mesh from Settings so the overlay and exported node names match what I intend, without breaking owned animations on that model.

**Acceptance**

- [x] When a bone or mesh is selected, Settings shows a **Name** field for that object’s `Object3D.name`
- [x] Commit on Enter / blur; Escape restores the previous name (same interaction as library rename)
- [x] Empty or whitespace-only names are rejected; the previous name is kept
- [x] Names must be unique within the owning model scene; duplicates are rejected
- [x] On commit, the selection overlay updates to the new name
- [x] For the owning model, **owned** clip tracks (`clip` / `sourceClip`) that target the old node name are rewritten to the new name; other tracks are preserved
- [x] Bind-pose override keys for that model move from the old name to the new name
- [x] **Shared** clips are not mutated (they may show a skeleton conflict on that model until retarget)
- [x] Rename is keyboard-operable and labelled (NFR-4)

### US-14 — Viewport general settings (axes)

As an editor user, I can show or hide the world axes and change how far the metre rulers extend from the top **Settings** menu (US-30).

**Acceptance**

- [x] Top **Settings** menu hosts world-axes controls (`WorldAxesControls`) and bones visibility (`BonesVisibilityControls`) — not the Settings aside
- [x] Checkbox to show/hide world XYZ axes (and X/Y metre rulers)
- [x] Checkbox to show/hide skeleton bone lines on previewed imported models (default on; **B** toggles via `toggleBones`)
- [x] Numeric control for axes length in metres
- [x] Toggling visibility mounts/unmounts axes in the viewport immediately
- [x] Changing length updates `axesHelper` and X/Y rulers live
- [x] Defaults match prior behavior: axes visible, length `10`
- [x] Axes / bones Settings toggles are session-only (no persistence across reloads); chrome panel sizes are separate (US-35)

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

As an editor user, I can choose Navigate, Edit, or Move in the preview — orbit freely, pose bones/meshes, or place the whole model on world X/Y/Z with or without an animation — and pose commits auto-apply (US-10).

**Acceptance**

- [x] When a model is loaded, preview chrome shows mutually exclusive **Navigate** (`ArrowsHorizontalIcon`), **Edit** (`CursorIcon`), and **Move** (`MoveIcon`) tool toggles in that order; default tool is **Edit**
- [x] Catalog hotkeys **1 / 2 / 3** switch Navigate / Edit / Move tool (same as the preview toolbar); tooltips include the hotkey and a short description
- [x] **Navigate:** OrbitControls only with hand-tool mapping (primary drag **pans** through the world; secondary drag orbits; scroll zooms); no TransformControls; raycast does not select or focus; Q / W / E toolbar is hidden
- [x] **Edit:** raycast selects a bone or mesh; TransformControls support translate / rotate / scale (**Q / W / E** toolbar when selected — US-10); works with **no** imported / active clip
- [x] **Move:** TransformControls translate the active model root on **world X / Y / Z** only; transform-mode toolbar hidden here (US-21 adds rotate / scale + **Q / W / E**); raycast does not switch selection away from the root
- [x] After a gizmo edit (either tool), pose marks dirty and **auto-commits** on gesture end (US-10) — no Save / Restore chrome
- [x] **Edit + no active clip — commit:** commits the selection’s local TRS as the model bind pose (persists on the scene graph and in exported `{model}.glb`) **and** rebases that node’s tracks in **every** library clip by the pre-edit → current TRS delta (so later / existing animations keep the structural edit; the user does not re-hold per clip). The same accumulated delta is applied when importing or replacing clips while that model is active, and again after US-6 retarget remaps tracks onto the character bones
- [x] **Edit + active ready clip — commit:** keeps US-4 Hold Pose to End (plateau on the working clip from playhead to clip end)
- [x] **Move — commit (no active clip):** commits the model root translation as the model rest / bind root (persists on the scene graph and in exported `{model}.glb`); never writes animation keyframes
- [x] **Move — commit (active ready/draft clip on that model):** stores the model root translation on **that clip for that model only** (`ClipEntry.rootPositionByModelId[modelId]`); seeks the playhead to **t=0** so the animation starts under that root; other models, other clips, and the T-pose rest root are unchanged; never writes animation keyframes
- [x] **Selecting a clip** applies that clip’s stored root position **for the playing model** (or the rest root when unset) and shows the clip at **t=0**; clearing the clip restores the rest / bind root via T-pose
- [x] **Settings / Move root edit with an active clip:** preview samples the clip at t=0 under the edited root (pending auto-commit) so the animation start pose matches the root — only the focused model’s scene is moved
- [x] Cancelling a dirty gesture uses Undo (US-10); no Restore Pose control
- [x] Switching Navigate ↔ Edit ↔ Move while dirty auto-commits, then switches tools
- [x] Changing selection (pick another bone/mesh or clear) while dirty auto-commits the pending edit on the previous object, then updates selection
- [x] Settings sidebar (`EditorSettingsSidebar` General) shows live **editable X / Y / Z** fields for the **model root position**, available whenever a model is loaded — **independent of Edit / Move tool**. Committing a number updates `scene.position`, marks dirty as a model-root edit, and uses the same auto-commit path as Move-mode gizmo edits. With an active clip, commit scopes that position to the clip; without a clip, commit updates the model rest root. (Bone/mesh local position is edited via the Edit gizmo, not these fields.)
- [x] Clicking the selected Animations list row (or otherwise clearing the active clip) restores the model’s current bind / rest pose in the preview so Edit-without-clip works without leaving an animation frozen on the last frame

### US-21 — Whole-model rotate / scale + Settings root rotation

As an editor user, when Move is selected I can rotate and scale the whole model, and I can set model-root rotation XYZ (0–360°) in Settings with the same Save path as root position.

**Acceptance**

- [x] **Move** supports translate / rotate / scale on the model root (world); **Q / W / E** toolbar visible while Move is active
- [x] Settings shows live editable **rotation X / Y / Z** (degrees, 0–360) and **scale X / Y / Z** for the model root when a model is loaded; values reflect the scene root on load / focus (after hoist of single-child wrapper TRS onto `gltf.scene`)
- [x] Rotation / scale edits mark dirty as model-root and share auto-commit with Move / position XYZ (US-10)
- [x] Commit with no clip stores root TRS as rest pose; commit with an active clip stores position + rotation + scale on that clip per model; selecting the clip reapplies them
- [x] On load / replace, `hoistRootTransform` promotes authored wrapper TRS onto the editable scene root

### US-7 — Multi-clip blending

As an editor user, I can create a new animation from scratch or use an uploaded clip, preview a weighted blend with other library clips, and Bake when I want that mix written into the active clip.

**Acceptance**

- [x] User can start a **New animation** from the Library (`PlusIcon`) — creates an editable draft from scratch
- [x] Active animation is selected from the **Animations list** (same pattern as models)
- [x] Clicking a currently selected animation unselects it to T-pose
- [x] Draft and uploaded clips support Start/End, playback speed, playback, and keyframe edits on the active clip
- [x] Settings **Blend** is a collapsible; expanded form has partner select, weight, **Bake**, and **Reset**
- [x] Blend is viewport-only until Bake; Bake writes into the active clip and resets the form; Reset clears without writing
- [x] Unsaved pose edits auto-commit on gesture end / selection change (US-10); Hold Pose to End commits into the active clip
- [x] Export: discrete library clips only — live `blendClipId` / `blendWeight` are not packed; Bake must run first for a mix to appear in the zip (US-5)

### US-19 — Nested library + clip ownership

As an editor user, I manage models and animations in a nested library: each model owns its clips, shared animations stay in a common pool, and retarget can fix one model or partially succeed across many.

**Acceptance**

- [x] Library sidebar is nested: **Models** collapsible → each **model** collapsible + sibling **Shared Animations** collapsible (session I/O lives on **File** — US-30)
- [x] Model header shows **ManIcon** next to the name; actions are icons: Retarget (when conflicted), **Animation** (add), Edit (rename), Replace, Remove
- [x] Shared Animations header shows **AnimationIcon**; no Upload / New header actions (those are **File → Import** / **File → New animation**)
- [x] **File → Import** is always available — does not require a loaded or selected model for animation-only files
- [x] Each clip row shows **AnimationIcon** next to the name; Remove (and Retarget when conflicted) as icons
- [x] Clips have ownership: `ownerModelId: string | null` (`null` = shared; otherwise listed only under that model)
- [x] File Import animation-only / **File → New animation** → shared (`ownerModelId: null`); create / import under a model → owned by that model
- [x] **Add animation** via model-header **AnimationIcon**: modal offers **Create new**, **Import** (files → owned by that model), and **Add existing** (selector of cloneable clips, excluding already owned / same-name under that model) → Apply → model-owned **clone** (new id); source unchanged — not replaced by File Import
- [x] Model import / replace: embedded GLB animations are registered as **owned** by that model (`ownerModelId` set); they never appear under Shared Animations
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

### US-23 — Create empty model + part edit

As an editor user with little or no 3D experience, I can create a new empty model, tweak parts in the viewport, and download a GLB — without uploading a file or knowing about skeletons.

**Acceptance**

- [x] **File → New model** **immediately** creates an empty `source: 'created'` model (no kit picker modal); not on the Models library header
- [x] **N** is a catalog hotkey for New model (same as File → New model; plain Cmd/Ctrl+N is browser-reserved)
- [x] New model joins preview and becomes focused (same as a successful import); default name like `New model 1.glb`
- [x] Created models do **not** require a skinned mesh or skeleton; imported models still do
- [x] Created models use metres, Y-up; parts sit on the ground when added (`y = 0` as appropriate)
- [x] Parts are named meshes; selection name overlay shows those names
- [x] **Edit** tool + TransformControls move / rotate / scale parts; dirty pose **auto-commits** (US-10 / US-15 bind-pose style on the scene graph — no animation keyframes required)
- [x] When a part is selected on a created model, the create toolbar offers **color** and **texture** and the Settings inspector shows **size** fields for that part kind; changes update the viewport live
- [x] User can **Duplicate** and **Delete** the selected part from the create toolbar (delete removes the mesh only, not the library model); Delete also removes selected create groups / multi-select roots (US-37)
- [x] Zip export (US-5 / US-22 path) packs created model scenes as `{model}.glb` like any other model when they have at least one stamped mesh part; empty created models (no parts) are skipped
- [x] Re-importing an exported created-model GLB (mesh scene, no skeleton) returns it to the model library as `source: 'created'`
- [x] Empty / first-run hint when a created model has no selection: short copy that points users to add / pick a part and use Edit

### US-24 — Primitive palette + add part

As an editor user, I can add common primitive shapes to my created model so I can build props, vehicles, or figures beyond the starter kits.

**Acceptance**

- [x] When a **created** model is focused, Create UI offers **Add part** for registered kinds: box, sphere, cylinder, capsule, plane, cone, torus, triangle, polygon, circle, ring, tetrahedron, octahedron, icosahedron, dodecahedron (compact MRU menu + browse — US-38)
- [x] Adding a part spawns it under that model’s scene at the origin (or a small default offset above ground), selects it, and uses kind default params + a default color
- [x] New parts are named uniquely (`box`, `box_2`, …) so the selection overlay stays readable
- [x] Added parts support the same inspector, Duplicate, Delete, and Edit auto-commit behavior as kit parts (US-23 / US-10)
- [x] Palette / browse modal are hidden for **imported** models (no accidental mesh editing of uploaded characters)
- [x] Export still packs the updated scene

### US-38 — Add-part MRU menu + browse modal

As an editor user, when I open **Add part** I see a short list of suggested or recently used shapes so I can add common parts quickly, and I can open **See more** to browse every kind grouped by type with a 3D preview before confirming.

**Acceptance**

- [x] When a **created** model is focused, the Add-part control opens a compact menu of **exactly five** part rows plus a final **See more** row (not a flat list of every kind)
- [x] **Cold start** (no stored history) shows defaults in order: box, sphere, capsule, dodecahedron, cone, then **See more**
- [x] Choosing a part from the compact menu adds it as today (US-24) and records it as the most recently used kind
- [x] Compact menu slots are an **MRU window of five**: newest used kind first; re-picking a kind already in the list moves it to the front with no duplicate; kinds past five drop off the bottom
- [x] Until five distinct kinds have been used, unused default suggestions still fill the remaining slots (MRU first, then remaining defaults in default order)
- [x] The ordered list of up to five kind ids persists in **localStorage** (`glb-studio.create.recent-part-kinds`) and restores on reload
- [x] **See more** opens a modal listing **all** registered part kinds, grouped by type (Solids / Planar / Polyhedra)
- [x] The modal always has a selected kind (defaults to box on open); click a row to select; a hero **3D preview** (shared viewport lights + ground) shows the selection; **Add part** confirms, updates MRU, and closes
- [x] Palette / menu / modal remain hidden for **imported** model focus (same gate as US-24)

**Out of scope:** frequency ranking; custom default suggestion list; persisting preview camera/orbit; changing spawn/export behavior for parts

### US-28 — Part color maps (textures)

As an editor user, I can apply a simple image texture to a selected part on my created model so props and kit pieces look less flat, and the texture is included when I export a GLB.

**Acceptance**

- [x] Create toolbar on a **created** model offers **Texture** (next to color): choose an image file (png/jpeg/webp as supported by the browser stack); clear returns to flat color (right-click clears when a map is set)
- [x] Applying a texture sets `MeshStandardMaterial.map` (and marks material for update); part keeps its color as multiplier
- [x] User can **clear** the texture and return to flat color
- [x] Primitives keep default UVs; no UV editor in this US
- [x] Exported GLB includes the texture image for textured parts
- [x] Imported character materials are not editable through this UI
- [x] Oversized / failed decodes show a clear error; do not corrupt the part material into a black void without recovery

**Out of scope:** full PBR authoring; texture painting; UV unwrap; server-side texture processing (prep/crop/wrap/bg-remove is US-39)

### US-39 — Texture prep modal (crop, wrap, bg remove)

As an editor user, when I texture a created part I can open a prep modal, see a live 3D preview of how the image will look, crop and wrap it, optionally remove the background in the browser, and get clear guidance so I upload a good image — then Apply commits the map or Cancel discards the draft.

**Acceptance**

- [x] Create toolbar **Texture** on a selected created part opens a **Texture** prep modal (not a silent file-only apply); right-click / Clear still removes the map without opening the modal when appropriate
- [x] Modal shows a **live 3D preview** of the selected part with the draft texture (reuse `ViewportEnvironment` lights + ground; same spirit as browse-part-kinds preview)
- [x] User can **choose / replace** the source image (png/jpeg/webp per US-28 caps); decode / size failures show **in the modal** (not only a toolbar tooltip)
- [x] Modal shows short **upload guidance** (prefer square or part-friendly aspect; PNG for transparency; aim ≤ 2048px on the long edge under hard caps; flat logos / patterns work better than busy photos)
- [x] Soft **warnings** for non-square-ish or very large (but still under hard max) images; hard rejects keep US-28 limits
- [x] User can **crop** and **flip** the draft image before Apply
- [x] User can pick **wrap presets** that drive Three texture wrap/repeat (at least: Clamp / stretch default, Tile 2×, Tile 4×) — no UV unwrap editor
- [x] Optional **Remove background** runs **client-side** (e.g. `@imgly/background-removal` or equivalent WASM); opt-in button with busy state; copy notes it runs in the browser; not auto-run on every pick
- [x] Transparent maps preview and export correctly enough for cutouts (`transparent` / `alphaTest` or equivalent on the part material when alpha is present)
- [x] **Apply** commits the draft to the real part material (US-28 apply path); **Cancel** / close discards the draft and frees GPU / ImageBitmap resources — library part unchanged on cancel
- [x] Imported / non-created focus never opens this modal
- [x] No Sharp / server texture endpoint in this US

**Out of scope:** server-side Sharp / resize / normalize API; full UV unwrap or projection painting; full PBR map authoring; auto bg-remove on every upload; texture prep on imported / skinned materials (crop / wrap / bg-remove stay created-only); texture painting. Skinned albedo apply / clear is **US-40** (not this modal).

### US-40 — Albedo maps on skinned (imported) models

As an editor user, when I focus a skinned model (imported character, skinned kit, or created-then-skinned), I can apply or clear an image color map on its mesh material so UV atlas skins (e.g. Kenney) and custom albedos show in the viewport and export.

**Acceptance**

- [x] When focused model is a skinned library model (`isSkinnedLibraryModel`), user can **apply** an image (png/jpeg/webp, US-28 caps) as `MeshStandardMaterial.map` on a target skinned mesh
- [x] User can **clear** the map and return to flat / previous non-map appearance (material `color` stays multiplier)
- [x] Target resolution: selected `SkinnedMesh` when selected; else sole skinned mesh under the focused model; multi-mesh with no clear target → disabled + clear reason
- [x] Entry UI available for skinned focus (`SkinnedTextureToolbar` — not the create-only toolbar); created-part Texture / US-39 prep unchanged
- [x] Post–Skin model models are included (same gate — no special case)
- [x] Oversized / failed decode shows a clear error; material not left in a broken black state
- [x] Exported GLB includes the applied map
- [x] Created (non-skinned) models stay on US-28 / US-39 path only
- [x] Skinned apply uses `flipY: false` so glTF / UV atlas skins (e.g. Kenney) orient correctly

**Out of scope:** texture prep modal on imported / skinned materials; full PBR maps; UV unwrap / painting; Kenney auto skin picker; editing materials on non-skinned imported mesh-only scenes beyond the created path. Session undo for maps + Library texture rows are **US-46**.

### US-46 — Color-map undo + library texture rows

As an editor user, when I apply, replace, or clear a color map on a created part or a skinned library model, I can undo and redo that change in the session; and when a skinned model has a map, I can see it under that model in the Library and clear it without hunting for the floating toolbar.

**Acceptance**

- [x] Apply / replace / clear of `MeshStandardMaterial.map` on a **created** stamped part pushes one undo entry; Cmd/Ctrl+Z restores the previous map (or no map); redo restores the committed map
- [x] Apply / replace / clear on a **skinned** library target (US-40 path) pushes the same command kind; undo/redo restores correctly
- [x] Failed decode / rejected file does **not** push an undo entry; live map unchanged
- [x] Undo does not leave a black / disposed map on the material (snapshot owns clones; live dispose only when safe)
- [x] Stack pruning / replacing redo branch disposes orphaned texture clones (no GPU leak)
- [x] Existing undo kinds (pose, trim, create scene/hierarchy) still work; texture commits interleave on the same session stack
- [x] Under each `isSkinnedLibraryModel` in the Library, when any skinned mesh has a `.map`, show a nested row (or rows) with a clear label (prefer `texture.name` / file name; fallback “Texture”)
- [x] Multi-mesh: one row per textured skinned mesh (include mesh name when useful)
- [x] Row offers **clear** (and optionally replace) without opening US-39 prep
- [x] Clearing from the Library uses the same clear + undo path as the floating tool
- [x] Rows update after apply / clear / undo / redo (`$materialMapsRevision`)
- [x] No texture row when the model has no maps; created models keep existing part toolbar / prep clear

**Out of scope:** texture prep modal on skinned / imported materials; full PBR maps; UV unwrap / painting; undo for color-only edits (`material.color` without map); durable undo across reloads; Kenney kit auto-picker; drag-and-drop texture onto library rows.

### US-25 — Grid and rotation snap

As an editor user, I can snap part moves and rotations to the grid so wheels, walls, and limbs line up without careful freehand nudging.

**Acceptance**

- [x] Top **Settings** menu exposes **Snap to grid** (position) with a step in metres (default `0.1`)
- [x] Settings exposes **Snap rotation** with a step in degrees (default `15`)
- [x] While snap is on and the user transforms a part (or model root in Move) on a **created** model, TransformControls quantize to the step
- [x] Snap can be toggled off for free placement; session-only (no persistence)
- [x] Imported character editing ignores snap even when flags are on (created-model focus only)
- [x] World axes / rulers (US-14) remain the visual reference; snap step is in metres

### US-30 — EditorToolbar

As an editor user, I can create models / shared animations, import files, and export from a top **File** menu, and tweak world axes and snap from a top **Settings** menu — without hunting through library headers or the Settings aside.

**Acceptance**

- [x] Full-width `EditorToolbar` exposes a **File** text menu with: **New model**, **From kit…**, **New animation**, **Import**, **Export**
- [x] **New model** creates an empty `source: 'created'` model; removed from the Models library header
- [x] **From kit…** opens a secondary modal of starter kits (label + one-line description); choosing a **mesh** kit creates a `source: 'created'` model with recipe parts; choosing a **skinned** kit loads a GLB as `source: 'imported'` (US-33) — same preview / focus path as New model for mesh kits
- [x] **New animation** creates a **shared** draft (`ownerModelId: null`); disabled when no focused model scene; removed from the Shared Animations header
- [x] **Import** opens a multi-file picker (`.glb` / `.gltf` / `.fbx`); removed from Models and Shared headers
- [x] Per file, Import routes by content: usable skinned mesh + skeleton → model library (`imported`, embedded clips **owned**); mesh-only scenes → model library (`created`, embedded clips **owned**); animations but no usable model → Shared Animations; neither → user-visible error for that file; other files in the batch still process
- [x] **Export** opens the existing **Export** modal (US-22 / US-26); does not pack immediately; removed from the Settings aside footer
- [x] Per-model **Add animation** modal (Create / Import / Add existing → owned) stays on the model row — not replaced by File Import
- [x] The same menu bar exposes a **Settings** text menu with **Show world axes**, **Axes Length (m)** (US-14), and snap controls (US-25); removed from the Settings aside Axes block
- [x] Blender-style full-width top bar (above asides + preview); text triggers open menus — not a floating viewport toolbar; mounted outside `EditorPreview`; does not block orbit, pick, or existing Edit / Move / create toolbars

### US-26 — Part hierarchy, outliner, and group

As an editor user, I can group parts (and models) with multi-select + context menu so a car body moves with its wheels, find parts by name in an outliner, and export models that share a group as one GLB without a Merge checkbox.

**Acceptance**

- [x] Created-model parts can be **grouped** into an empty group node so moving the group in Edit moves children (`Object3D` hierarchy; world transform preserved; cycle guard)
- [x] **Ungroup** dissolves empty groups or lifts nested parts to the parts root (world preserved)
- [x] **Part outliner** lists mesh parts and group nodes under created models; click selects; parents collapse/expand; list stays in sync on add / duplicate / delete / rename / regroup
- [x] Skeleton-bone outliner for imported models is **US-31** (deferred from this story)
- [x] **Shift+click** multi-selects in the library (model rows + part outliner) and viewport; parts and models never mix in one selection
- [x] With a part or model multi-selection, **arrow-key nudge** and Settings **position XYZ** apply the same delta to every selected root (nested parts under another selected node are skipped once); rotation / scale / gizmo multi-drag stay single-target
- [x] **Right-click** opens **Group** / **Ungroup** / **Make connector** / **Unjoint** for create parts on a created model (library + preview), and **Group** / **Ungroup** for library models — **without changing selection** (actions use the current selection); Group creates an organizational create group (average world origin pivot, all selected under it); Make connector is one-step (mark bend points → Connect; 2+ form a branching limb tree; auto-names from parts); Ungroup dissolves plain groups or lifts parts that sit directly under a plain group (not under connectors / unmarked parents); Unjoint dissolves joints only; Skin builds bones from joints only
- [x] Settings **Parent** `<select>` and create-toolbar Unparent are removed (context menu only)
- [x] Models can be **grouped / ungrouped** the same way; each model group with ≥2 exportable members packs as one GLB (meshes + each member’s owned ready clips, bone-prefixed; shared stay sidecars); ungrouped models stay separate; empty created models omitted; Export modal Merge checkbox removed

### US-27 — Additional kits via registry

As an editor user, I can optionally start from a starter kit (for example a modern house or block robot) so I get a head start — without changing the primary Plus → empty flow.

**Acceptance**

- [x] At least **two** kits are registered (**Modern house** / `simple-building`, **Block robot**) in the kit registry
- [x] A secondary **From kit…** entry (not the Plus button) lists them with beginner-friendly labels and one-line descriptions
- [x] **Mesh** kits follow the same library / preview / Edit / export path as `createEmptyModel` (`source: 'created'`)
- [x] Plus / New model still creates an **empty** model with no modal
- [x] No new PartKind is required unless a kit truly needs one; prefer existing kinds
- [x] **Mesh** kits remain editable (parts are normal meshes — not locked prefabs)
- [x] On a created model with stamped create-group hierarchy, **Edit** viewport pick prefers the **nearest parent create-group** so transforming that joint moves its child parts together (limb feels connected)
- [x] User can still target the **mesh** when needed: a **second** viewport pick on the same part while its parent create-group is selected drills into the mesh (plain or Shift+click); outliner clicks stay exact

### US-33 — Skinned starter kit (Block robot GLB)

As an editor user with little 3D experience, I can start from a **skinned** Block robot kit so I immediately see bones in the viewport, browse joints in the library, and play skeletal animations — like an imported Mixamo character — without leaving the From kit flow.

**Acceptance**

- [x] Kit registry supports a **skinned asset** kit kind (`skinnedAsset` URL) in addition to mesh + create-group recipes
- [x] **From kit…** lists **Block robot** (skinned GLB only); choosing it loads `/kits/block-robot.glb` into the model library as `source: 'imported'`
- [x] Viewport shows skeleton lines on the skinned kit model (same helper as other imported models)
- [x] Library under that model shows **bones, then owned clips** (US-31 order); embedded GLB clips register as owned (none in the shipped kit)
- [x] User can Edit-select bones, Hold Pose / playback / export like any other imported character
- [x] Zip export packs the skinned kit model as a normal imported GLB
- [x] **File → New model** and the mesh-only Modern house kit stay unchanged
- [x] Mesh create-group Block robot recipe is maintainer-only (`BLOCK_ROBOT_MESH_RECIPE` / `npm run kits:block-robot`), not listed in From kit
- [x] Asset contract documented in [`public/kits/README.md`](../../public/kits/README.md) (T-pose bind, bone names, no demo clips, license)
- [x] Load failure of the kit GLB shows a clear error in the From kit modal; does not leave a half-empty library entry

### US-34 — In-editor skinning for created models (MVP)

As an editor user building a character from parts (or a mesh kit with joints), I can **skin** my model so limbs bend with a real skeleton, I see bones in the preview, and I can play / export skeletal animations — without leaving the editor for Blender.

**Acceptance**

- [x] Focused **created** model with at least one create-group joint offers **Skin model** on that model’s library **⋯** menu
- [x] Action is disabled with a clear reason when prerequisites fail (e.g. no joints; no parts; already skinned; not a created model)
- [x] On success: scene has a usable `SkinnedMesh` + `Skeleton`; `source` is `imported`; SkeletonHelper + bone outliner + skeletal clip validation apply
- [x] Viewport shows `SkeletonHelper` while the model is previewed (when Show bones is on)
- [x] Library shows **bone outliner** (bones then owned clips); create toolbar and part outliner are gone for that model
- [x] User can select bones and use Edit / Hold Pose with an owned clip on that skeleton
- [x] Export packs a skinned GLB that re-imports as `imported` with bones intact
- [x] Undo is **not** required (US-10); failed skin leaves the previous created scene intact (transactional: mutate a clone, swap on success)
- [x] Mesh-only models **without** a joint armature: blocked with disabled reason copy
- [x] Modern house / prop kits stay disabled via no-joints / prerequisites
- [x] Created-model part multi-select (≥2) offers **Group** (organizational) and **Make connector** (mark bend points → Connect; 2+ form a branching tree; auto-names)
- [x] Created-model part selection offers **Ungroup** (dissolve plain groups / lift) and **Unjoint** (dissolve joints only)
- [x] Skin requires ≥1 joint (not merely a plain group); plain groups do not become bones
- [x] Model multi-select context menu still says **Group** / **Ungroup** (library model groups)
- [x] Weights are **rigid only** (each part weight 1 to parent bone); no paint UI

### US-31 — Bone outliner + skeleton helper (imported)

As an editor user, when I preview an imported character I can see its skeleton in the viewport and browse its bones under that model in the library so I can find and select joints without hunting by raycast alone.

**Acceptance**

- [x] Under each **imported** model in the library, a **bone outliner** lists the skeleton hierarchy (depth indent, collapse chevron); order under the model is **bones, then owned clips**
- [x] Clicking a bone row focuses that model if needed, switches to **Edit**, and selects the bone (Shift+click toggles multi-select like parts)
- [x] Created models keep the part outliner only — no bone outliner
- [x] Every **previewed** imported model shows a Three.js **SkeletonHelper** in the viewport when **Show bones** is on (top **Settings** menu; default on; **B** toggles)
- [x] Helpers are not pick targets (do not steal raycasts from meshes/bones)
- [x] Hiding a model (eye off), removing it, or turning **Show bones** off removes its helper

### US-32 — Group GLB round-trip (split on import)

As an editor user, when I export a model group as one GLB and import that file again, I see the same library shape: a group containing each member model, with each model’s animations nested under that model.

**Acceptance**

- [x] Group export writes an editor manifest on the packed root (`userData`) listing group name, each member’s file name / source / bone prefix, and which embedded clips belong to which member (export name + library name)
- [x] Each member root is stamped so import can find it after GLTF round-trip
- [x] Importing a GLB with that manifest (≥2 members) creates **separate** library models (prefix stripped; tracks remapped), then recreates the **model group** with the saved name
- [x] Owned clips nest under their owning model (library names restored); shared sidecars unchanged
- [x] GLBs **without** the manifest keep the single-model import path
- [x] Created vs imported `source` per member is restored from the manifest

### US-10 — Undo / redo + editor commands

As an editor user, I can undo and redo animation edits within the session, and I can use documented keyboard commands (playback, transform modes, axes, bones, nudge, commit pose, create-part clipboard, undo/redo) without hunting through the UI.

**Acceptance — undo / redo**

- [x] Undo / Redo controls (Edit menu) and standard shortcuts reverse and reapply discrete edit commands
- [x] Covered operations: trim apply, keyframe save/update (auto-commit pose — including created-part / create-group TRS when no owned ready clip), speed changes that mutate exported bake intent (`timeScale`), create-part **Group / Ungroup / Make connector / Unjoint** hierarchy commits, and create-graph **Add part / Paste / Delete** (`createScene`) — exact command set in design
- [x] Undoing Group / Ungroup / Make connector / Unjoint restores parent + local TRS (and recreates / removes group or joint nodes with stable UUIDs) so parts do not jump or disappear
- [x] **Delete** removes stamped create parts, create groups (whole subtree), and multi-select clipboard roots; toolbar Delete enabled whenever that selection is eligible (US-37)
- [x] Undoing Add / Paste / Delete restores or removes create trees with stable UUIDs at recorded parents (US-37)
- [x] Pose undo/redo restores parent as well as local TRS when the snapshot recorded a parent, so a pose commit is safe across intervening hierarchy changes only when those hierarchy ops were themselves undone first (stack order)
- [x] Stack is per-session (not persisted to disk)
- [x] Pre-trim recoverability is via undo of `trimClip` (and re-trim from `sourceClip`); one-shot Restore pre-trim chrome superseded
- [x] Undoing does not leave the mixer bound to a disposed/stale clip

**Acceptance — hotkeys & Commands UI**

- [x] A pure command catalog is the single source of truth for chords, labels, and categories (hotkeys + Commands modal share it)
- [x] Shortcuts do not fire when focus is in an input, textarea, select, or contenteditable that owns typing
- [x] Transform modes: **Q** Move, **W** Rotate, **E** Scale; toolbar labels match the catalog
- [x] Edit tools: **1** Navigate, **2** Edit, **3** Move tool; preview toolbar tooltips match the catalog chords
- [x] **R** toggles world axes visibility; **B** toggles skeleton bone lines (`bonesVisible`)
- [x] **Space** toggles play / pause when a clip can play
- [x] Arrow keys nudge the current selection on **X** (left/right) and **Y** (down/up); **Shift+↑ / Shift+↓** nudge on **Z**; each step is `0.01` m (same as position TRS inputs), not the snap grid step; part / model multi-select nudges every selected root by that step
- [x] Pose edits **auto-commit** on gesture end (gizmo drag-end, nudge, Settings blur, tool/selection change, play); **Cmd/Ctrl+S** commits if still dirty; no Save / Restore pose chrome
- [x] **Cmd/Ctrl+C / V** copy / paste create parts, create groups, and part multi-select (in-session buffer); **Delete** / **Backspace** remove eligible roots (`deleteSelectedPart` — parts, groups, multi-select; US-37)
- [x] `EditorToolbar` exposes a **Commands** control that opens a modal listing all catalog entries with their chords; **Edit** menu exposes Undo / Redo from the catalog
- [x] Undo / redo shortcuts are catalog entries: **Cmd/Ctrl+Z**, **Cmd/Ctrl+Shift+Z** (or **Y**)

### US-35 — Resizable editor chrome

As an editor user, I can drag-resize the Library and Settings asides and the bottom preview bar so long bone lists and Tracks rows are readable, and those sizes are remembered across reloads.

**Acceptance**

- [x] Library (left) and Settings (right) asides are drag-resizable on desktop (`>640px`); sizes clamp to documented min/max
- [x] Bottom preview / playback bar is drag-resizable on desktop **and** mobile (top edge)
- [x] Aside horizontal resize is disabled on mobile (collapse / overlay unchanged)
- [x] Panel sizes persist via project `localStorage` helpers (`glb-studio.*` keys) and restore on reload
- [x] Collapse / expand of asides still works; resize applies only while open
- [x] Shared `ResizableShell` owns drag + size; callers do not reimplement pointer math

**Out of scope:** persisting snap / axes / other Settings toggles (session-only); aside open/closed state; double-click reset-to-default

## Post-MVP user stories

Not started; do not implement until explicitly kicked off. Full requirements, design, and tasks live only in the delta folders (not duplicated here):

- **US-8** — Morph-target editing → [`specs/us-8/`](../us-8/)
- **Figure craft series** (created models; do not start until explicit kickoff per US):
  - **US-41** — Mesh craft foundation (bake + geometry undo) → [`specs/us-41/`](../us-41/)
  - **US-42** — Craft brushes + sanding → [`specs/us-42/`](../us-42/)
  - **US-43** — Round corners (parametric bevel) → [`specs/us-43/`](../us-43/)
  - **US-44** — Cut holes (boolean subtract) → [`specs/us-44/`](../us-44/)
  - **US-45** — Fuse / join parts (boolean union) → [`specs/us-45/`](../us-45/)

## Non-functional requirements

- **NFR-1 Modular domains:** Logic lives under `src/modules/<domain>/` (`editor-shell`, `commands`, `viewport`, `animation`, `export`, `import`, `create`); pages stay thin
- **NFR-2 Layering:** `services/` = HTTP; `domain/` = business logic; `utils/` = shareable helpers; `adapters/` = external boundaries + mappers; `actions/` = store commands. No R3F / Tailwind / GSAP in `services/` / `domain/` / `utils/` (`three` OK for 3D code)
- **NFR-3 Island boundary:** Canvas and editor interactivity hydrate as a client React island; Astro owns the static shell
- **NFR-4 Accessibility:** Sidebar controls are keyboard-operable and properly labelled
- **NFR-5 Asset contract:** Bone-name mismatch is an explicit error; no hardcoded vendor prefixes without a registry

## Out of scope (still excluded)

- Full material / texture editing on **imported** characters beyond albedo on skinned meshes (PBR maps, prep modal, painting, mesh-only non-skinned imports beyond the created path). Created-model color maps + prep remain US-28 / US-39. Skinned albedo apply / clear is **US-40** (shipped). Session undo/redo for albedo apply/replace/clear (created + skinned) and Library texture rows under skinned models are **US-46** (shipped). A beginner **atlas Skin editor** (templated stamps / fill + live preview, model-adaptive size/layout; vendor-agnostic templates) is planned as **US-47** — not kicked off. Until US-47 ships: no skin-builder modal on skinned. Full PBR, UV unwrap, and durable undo across reloads stay out
- Kit marketplace / remote download; user-authored kit save/share; optional clothed block kit variant (extra shirt/pants meshes — content-only if ever added)
- Full Blender-style collections / drag-and-drop reparent in the part outliner; boolean mesh fuse
- Vertex / edge snap between parts; magnet snap to other part pivots; click-to-place spawn on grid
- Weight paint / soft auto-weights / advanced rigging on created-then-skinned models (US-34 MVP is rigid weights + Skin model only); Mixamo / retarget of arbitrary clips onto a new skeleton beyond existing US-6 when names align
- Server accounts (FBX import via US-16 and optional FBX export convert via US-36 are the allowed server round-trips; no user accounts)
- Collaborative editing / durable undo across reloads
- Full NLA strip editorial beyond US-7 blend/cross-fade
- FBX / GLB larger than Vercel’s function payload (typically 4.5MB) until a later blob / chunked upload
- Per-entry format mix inside one export zip; client-side FBX writer; bit-identical FBX ↔ GLB round-trip / group-manifest on FBX export
