# Design — current

Architecture for the GLB Character & Animation Editor MVP.

## High-level

```mermaid
flowchart LR
  AstroPage --> EditorIsland
  EditorIsland --> EditorShell
  EditorIsland --> Viewport
  EditorIsland --> AnimationDomain
  EditorIsland --> ExportDomain
  AnimationDomain --> Mixer
  AnimationDomain --> ClipLibrary
  Viewport --> R3FCanvas
  ExportDomain --> GLTFExporter
```

- [`src/pages/index.astro`](../../src/pages/index.astro) mounts `EditorSidebar` and `EditorPreview` as `client:only="react"` islands
- Domains: `editor-shell`, `viewport`, `animation`, `export`, `import`, `create` under `src/modules/`

## Assets

| Asset              | Role                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| Model GLB/GLTF     | Skinned mesh + skeleton when **imported**; many in the session, **several** previewed at once (US-20) |
| Created model      | Empty or primitive mesh scene (`source: 'created'`); no skeleton required (US-23)      |
| Animation GLB/GLTF | Source of `AnimationClip`s only; mesh payload ignored or discarded after clip extract |
| Model / clip FBX   | Converted to GLB via `POST /api/v1/fbx-to-glb`, then the same load path as above      |

Clips have **ownership** (`ownerModelId`: `null` = Shared Animations; otherwise listed only under that model). Owned clips validate against their owner skeleton; shared clips validate against the model in context (focused for Shared UI; a given model when checking that model’s conflicts / export). Mismatch → user-visible Needs retarget; explicit retarget flow (US-6 / US-19). Shared global status is not flipped when each mixer mounts; per-model fit is checked in the library UI.

## Model load (US-11 + US-20)

1. User picks one or more `.glb` / `.gltf` / `.fbx` files (File API); `.fbx` converts first — see **FBX import** below
2. Adapter parses each via imperative `GLTFLoader` and a blob URL (`viewport/adapters`)
3. Validate skinned mesh + skeleton per **imported** file; else user-visible error and that file does not join the library. **Created** models skip this path (`createEmptyModel`)
4. Append successful loads to `models[]` with `source: 'imported'`. New loads join `previewModelIds` (visible by default). The last successful load in that batch becomes `activeModelId` (focused)
5. Viewport mounts every previewed model’s scene graph (`ModelViewer` primitives). Hidden library graphs stay in memory until Remove. Eye toggle on a model row adds/removes that id from `previewModelIds`
6. Replace updates that entry only (keep id). If it is previewed, swap that graph and re-frame the union of visible models. Remove disposes that graph / blob URL (skip revoke when `blobUrl` is absent on created models); if it was focused, focus another previewed model or idle empty state

Empty overlay when idle; clear error copy on parse failure or missing skeleton. After a successful load **or preview-set change**, camera frames the **union AABB** of visible scenes from a fixed three-quarter elevated angle (`computeScenesFraming` + `DEFAULT_VIEW_OFFSET` in `viewport/constants/camera.ts`; framing padding in `viewport/domain/model-framing.ts`). Scenes keep their own origins; place them with Move / Settings XYZ.

Sidebar **Library** is nested (US-19): **Models** (New model Plus + upload) → each model collapsible (`ModelIcon` + eye preview + Retarget / Animation / Edit / Replace / Remove) listing owned clips; sibling **Shared Animations** (`AnimationIcon` + Upload / New). Clip rows use `AnimationIcon` + iconized actions. **Focus** (`activeModelId`) is distinct from preview membership: selecting a model name sets focus (and shows it if hidden); clicking the focused name again clears focus (same toggle pattern as clips). Gizmo and Settings XYZ target the focused model; Play / Pause / Stop / scrub work with a selected clip even when focus is cleared (transport falls back to all previewed mixers).

Do not add a second debug canvas, FPS overlay render path, or smoke-test scene that bypasses the editor viewport lifecycle.

## Create empty model + parts (US-23)

1. **New model** (Plus next to Load) calls `createEmptyModel()` immediately — empty `Group` scene, `source: 'created'`, name like `New model N.glb`, joins preview + focus. No kit picker (kits are US-27)
2. Domain `create/` owns `PartKind` registry (`box` / `sphere` / `cylinder` / `capsule` / `plane`), `Kit` seam (unused by New model), `spawnPart` / `duplicatePart` / `deletePart`, ground-origin geometry, size rebuild from `userData.createPart`
3. Parts are named meshes (`nextPartName` → `box`, `box_2`, …); metres + Y-up; bottom-origin geometry so identity TRS sits on the ground
4. When focused model is `source: 'created'`: vertical create **ToolBar** after Settings (color, duplicate, delete); Settings **PartInspector** for kind size fields; first-run hint when nothing is selected
5. Edit Save / Restore for created-part selection: always commit local TRS on the mesh (scene graph + rest-pose refresh); never write keyframes or rebase library clips
6. `packModelGlb`: created models export mesh scene only (no shared-clip attach). Animation-only zip fallback prefers an imported rig when one exists
7. Growth seams: primitive palette (US-24), snap (US-25), hierarchy (US-26), kits (US-27), textures (US-28)

## Nested library + clip ownership (US-19)

1. `ClipEntry.ownerModelId: string | null` — `null` = Shared; otherwise only under that model
2. Shared import / New → `null`; create / import / Add under a model → that model’s id; embedded model GLB clips register as owned **without** auto-selecting. Shared **Upload** does not require a loaded or selected model — successful shared imports stay `ready`; skeleton fit is contextual per model in the library UI / export
3. **Add animation** modal (model-header Animation): Create new | Import | Add existing → owned clone (`cloneClipAs`); source unchanged
4. Validation (`syncClipsToSkeleton`): owned vs owner skeleton; shared mismatch is contextual per model in the library UI (focused model for Shared rows)
5. Retarget scopes: **This model** on shared/other → new owned ready clip (same name), keep source; **This model** on owned-by-target → remap that entry in place; **All models** → remap shared in place, rename bones only on compatible models, leave incompatible conflicted (partial success). Remap keeps the clip name. A ready owned clip with the same name suppresses Needs-retarget for a mismatched shared clip on that model
6. Export: per-model GLB = owned ready + validating shared; animation-only zip entries = shared working clips only

## Playback

- One `AnimationMixer` per previewed model (`ClipMixerDriver` → `useClipMixer` per `modelId`; sessions keyed in `mixer-session`)
- Primary action = resolved clip for that model (or `blendBaseClip` while a blend partner is selected); optional secondary blend action for the partner clip
- Selection: owned clip under model M sets `activeClipByModelId[M]` and leaves other models’ owned selections, clearing `activeSharedClipId`; shared clip sets `activeSharedClipId` and clears all `activeClipByModelId`
- Per-model clip resolution (`resolveActiveClipIdForModel`): explicit `activeClipByModelId[modelId]` wins; else if `activeSharedClipId` is set, that model plays its **ready owned** clip with the **same display name** when one exists, otherwise the shared clip
- Loading or focusing a model does **not** auto-select a clip (T-pose until the user picks one). Embedded GLB clips register as owned without calling `selectClip`
- Live blend weights snap via `setEffectiveWeight` (not `crossFadeTo`)
- Play/Pause is a global `$clips.playing` flag that advances every previewed mixer; enabled whenever a clip is selected and at least one model is previewed (**model focus not required**)
- Stop / scrubber / timeScale target the **focused** model’s session when one is set; with **no** focused model they apply to every registered (previewed) mixer so transport still works after clearing model focus
- Speed: per-clip `timeScale` on the library entry; live playback applies that clip’s scale via `mixer.timeScale` on the transport target session(s)
- Switching a model’s clip stops that model’s previous action(s) and plays the new one; clearing selection (**T-pose**) restores that model’s captured rest / bind pose (not the last animated frame)

## Animation library authorship (US-7)

- Library **New animation** (`PlusIcon`) creates `status: 'draft'` from scratch (default duration 1s); drafts with clip data are playable/editable (`isReadyClip`: `status !== 'error'`)
- Selection: click an Animations list row (same pattern as models). Clicking the currently selected clip clears to T-pose. No Active Clip dropdown
- Settings: Start/End and Speed always visible; **Blend** is a reusable `Collapsible` (`src/components/collapsible/`) with partner select, weight, **Bake**, and **Reset**
- `$clips` holds `blendClipId`, `blendWeight`, `blendBaseClip` (primary snapshot when a partner is chosen)
- Blend overlay is **viewport-only** until **Bake** flattens primary + secondary at weight into the active library clip and resets the form; **Reset** clears the form without writing
- Unsaved bone/gizmo edits discard on reselect; **Hold Pose to End** commits into the active clip
- Playback bar: controls + scrubber only

## Animation import

1. User selects one or more `.glb` / `.gltf` / `.fbx` files; adapter loads each and collects `animations` into library entries (stable id + display name + clip) — file meshes are never shown. `.fbx` converts first — see **FBX import** below
2. Validate each clip's track targets against the loaded character node/skeleton map; missing/unknown bones → the entry is marked errored with user-visible copy (no silent remap; no automatic vendor prefix rewriting in playback)
3. Re-validate owned entries when a model is replaced or removed so stale clips are never silently played on a mismatched rig (`syncClipsToSkeleton`)
4. Sidebar lists clips under their owner model or Shared Animations with Replace / Remove / Rename (iconized). Replace re-picks one file and updates **that** entry only (first clip in the file; keep the entry id and `ownerModelId`). Remove drops the entry; if it was active, select the next ready clip or clear selection. Errored clips that still have a working `AnimationClip` offer **Retarget**
5. Active clip is chosen from the library list (US-7). Preview chrome owns Play / Pause / Stop / loop and the scrubber; those stay disabled until a valid clip is selected for that skeleton. Clicking the selected row again clears to T-pose
6. Preview layout: viewport fills remaining height (`flex-1 min-h-0`); playback bar is a shrink-to-content footer under the canvas (not a fixed magic height overlapping the scene)

## Cross-rig retargeting (US-6)

1. Detect mismatch (unknown track targets vs character bone names) — same US-2 validation path
2. Library **Retarget** on errored clips opens a **modal** (`$retargetClipId`); Settings aside stays available; Cancel / overlay / Escape closes. Model-header Retarget with **multiple** conflicted clips sets `$retargetCandidateIds` and shows a **picker step** before the bone map; a single candidate or clip-row Retarget goes straight to mapping
3. Mapping UI: clip bone → character bone, with registry suggestions, mapped / will-skip status, progress, and “show unmapped only”. Leave blank to skip (drop those tracks). UI shows short vendor labels (e.g. `Hips`); hover/`title` keeps the raw id. Mapping values and remapped tracks always use real bone names. Remapped clips keep the source display / `AnimationClip` name (no `(retargeted)` suffix)
4. Target dropdown lists **skeleton bones only** (not meshes / scene roots)
5. Apply scope (explicit):
   - **This model** — if the source is owned by the target model, remap that entry in place to ready; otherwise create a new ready owned clip with the **same name** and **keep** the shared/other source
   - **All models** — remap the shared clip in place and **normalize bone names only on models that resolve the map**; incompatible models stay conflicted for that clip (partial success — no whole-apply failure)
6. Unmapped source bones are **skipped** on Apply (their tracks are omitted from the remapped clip). Apply requires at least one mapped bone; other failures leave a clear error and do not corrupt pose
7. After a successful remap, apply the previewed model’s accumulated **bind-pose deltas** to the remapped tracks — mismatched imports cannot rebase on import because track names still use the source rig
8. **Position scale (US-17):** on Apply, compute `ratio = median(‖target bind local pos‖ / ‖source bind local pos‖)` over mapped pairs with both lengths > ε (`1e-6`). Capture `sourceBindLengths` from the clip GLB scene at import; target lengths from the previewed scene at Apply. If no usable pairs → clear error; no clip write / no All-models renames. Ratio is relative to the **previewed** skeleton
9. **Hips bind-frame (US-18):** keep `.position` only for the mapped hips bone; drop other position tracks. Rebase hips quaternions and hips **delta-from-bind** positions through source→target parent world quaternions at rest: `p' = targetBind + R_tgt⁻¹ · R_src · ((p − sourceBind) · ratio)`. Capture `sourceBindFrames` (local position + parent world quat) at clip load; target frames from the previewed scene. Missing hips / frames while positions exist → clear Apply error

### Bone registry (vendor adapters)

- **Core** (`bone-registry.ts`) is vendor-blind: exact name match, then first confident suggestion from registered adapters, then `buildAutoMapping` / `buildTargetBoneNames` / `boneDisplayName`
- **Adapters** implement `BoneVendorAdapter` (`types/bone-vendor.ts`): `suggest` + `displayName`. Each vendor is a separate module under `adapters/bone-vendors/`
- Playback / mixer / remap never import vendor strings — only resolved target names
- Composition: `adapters/bone-vendors/index.ts` lists adapters. Add/remove a vendor by editing that list only
- `mixamo` adapter: prefixes `mixamorig:` / `mixamorig` (longest first); strip leading digits after the prefix; alias local names to project convention where they differ; UI `displayName` is the local bone

Suggestions autofill the mapping UI only; Apply is still required (no silent retarget on import).

## Rename library entries (US-12)

1. `renameModel(id, name)` / `renameClip(id, name)` — trim; no-op if empty or unknown id; keep entry `id` stable
2. Model rename updates `ModelEntry.fileName` only. Clip rename updates `ClipEntry.name` and, when present, `AnimationClip.name` on both working `clip` and `sourceClip`; `sourceFile` stays provenance
3. Shared `AssetEntry` inline rename (Rename control and/or double-click label): commit on Enter / blur, Escape cancels
4. Finder-style selection: basename only when the label ends in `.glb`/`.gltf`; suffix stays in the field. If commit omits the extension entirely, restore the previous `.glb`/`.gltf`; a user-typed suffix is kept
5. Zip basenames (US-5) follow renamed `fileName` / `name` via existing `stripGlbExtension` + collision suffixes

## Trim

1. Clone the active clip's **working** reference — actually trim from the retained **source** clip so the window can always be re-derived against the full original duration
2. `trimClipWindow(source, start, end)` in `animation/domain`: per track, `KeyframeTrack.trim(start, end)` keeps in-window keys (plus the first key before `start` for interpolation), then re-baselines track times by `−start` and sets `clip.duration = end − start`. (`AnimationClip.trim()` in three 0.185 is a no-arg helper that only crops to the clip's own duration — it does not take a window)
3. Replace the library entry’s working `clip` with the result (the source clip is never mutated)
4. The pre-trim clip stays recoverable for the session via the entry's `sourceClip` reference (restore control or re-trim from source)

## Time scale on export (US-5 contract)

Each library entry stores its own `timeScale` (default `1` on import / new draft). The Speed slider edits only the active entry; live playback sets `mixer.timeScale` from that entry. On export, **bake** each clip’s own scale into track times / clip duration so the downloaded GLB plays at the edited speed in other viewers (no reliance on runtime `timeScale`).

## Keyframe write (US-4)

1. Pause (or scrub) so the timeline playhead is the target timestamp
2. Raycast → select bone or mesh; attach TransformControls (Edit tool)
3. Editing the selection with TransformControls marks pose dirty; Save / Restore appear in the preview overlay only while dirty (Hold Pose to End copy when an active ready clip drives the save)
4. On hold (active ready clip on the focused model):
   - Read selection local position, quaternion, scale
   - Resolve the clip **driving that model** (`resolveActiveClipIdForModel`), not only `activeClipId`
   - Find tracks by parsed node name + suffix (`splitTrackName`); update all matches (keep existing track.name). Create `${node}.position|quaternion|scale` only when none match
   - Write a hold plateau from clip-local playhead `t` through `duration` (sample at `t` and at `duration`; remove keys strictly inside); do not extend clip duration. Scrub + edit + hold again later overwrites from the new playhead forward
   - Clear any blend partner / base snapshot so preview uses the updated working clip
   - Clear pose dirty
5. Restore with an active clip: resume mixer bindings and re-apply the clip at the current playhead (discard unsaved gizmo edit)
6. After hold, clear pose dirty but **leave the previous action suspended**; `useClipMixerAction` rebinds the updated clip at the same playhead (uncache previous action). Do not call `restoreMixerPose` / `resumeMixerBindings` in `saveKeyframe` — those resample the old action and desync the scrubber playhead

Bind-pose / Move / T-pose Save–Restore branching: see **Edit / Move tools & bind pose (US-15)** below.

## Edit / Move tools & bind pose (US-15)

1. **`$editTool`** (`'edit' | 'move'`, default `'edit'`) — toggle in `EditorPreview` with `CursorIcon` / `MoveIcon` when a model is loaded
2. **Edit** — raycast selection + TransformControls in local space; W / E / R when something is selected; works with **no** active clip (T-pose)
3. **Move** — attach TransformControls to the active model root in **world** space; mode from `$transformMode` (translate / rotate / scale); show W / E / R toolbar while Move is active; ignore raycast picks so the user stays on the root
4. **Dirty + snapshot** — on first gizmo / Settings root change, mark `$poseDirty`, set `$poseEditKind` (`modelRoot` | `selection`), snapshot pre-edit local TRS
5. **Save** (by `$poseEditKind`, not active tool)
   - `selection` on a **created** model part → keep Object3D TRS; refresh rest-pose snapshot; **never** write keyframes or rebase library clips (even if a shared clip is selected)
   - `selection` + active ready clip → US-4 Hold Pose to End
   - `selection` + no ready clip → keep Object3D TRS; rebase that node’s tracks in every library `clip` / `sourceClip` by pre-edit → current delta; accumulate per `modelId` + node name for import / replace / post-retarget; refresh rest-pose snapshot; clear dirty
   - `modelRoot` + no ready/draft clip → keep `scene` TRS; refresh rest-pose snapshot; no keyframe write / no clip rebase
   - `modelRoot` + active ready/draft clip **on the focused model** → keep `scene` TRS; store position, Euler degrees, and scale on `rootPositionByModelId` / `rootRotationByModelId` / `rootScaleByModelId`; do **not** refresh the model rest-pose root; seek playhead to **t=0** so the clip starts under the saved root; no keyframe write / no clip rebase; other models are untouched
6. **Restore** — `selection` + active clip → `restoreMixerPose`; otherwise write snapshot TRS back onto the object
7. Tool switch or Settings/gizmo kind change while dirty → auto-Restore first. Selection change / clear while dirty → `restorePose()` before updating `$selection`
8. **Settings General** — **Axes** (world axes toggle/size) and **Model** sections. Model hosts live editable root **position** (m), **rotation** (degrees, 0–360, Euler `XYZ`), and **scale** as **percent of rest / bind root size** (`100` = rest scale on that axis); independent of tool; same dirty / Save / Restore path as Move (clip-scoped when a clip is active on the focused model). With an active clip, edits sample the clip at t=0 so the start pose sits under the new root. Readout reflects the loaded scene root on import / focus (after load-time `hoistRootTransform` promotes single-child wrapper TRS onto `gltf.scene`)
9. **Clip root transform** — `ClipEntry.rootPositionByModelId`, `rootRotationByModelId` (degrees), and `rootScaleByModelId` (session library metadata). Each model’s mixer applies only its own entries when that clip is playing; missing key restores that channel from the model’s rest-pose root. Selecting or saving a clip root always begins playback preview at t=0 on the focused model
10. **T-pose** — `activeClipId: null` via clicking the selected Animations row again (or clear); applies captured rest / bind pose (snapshot at mixer mount; refreshed on bind-pose or model-root Save **without** an active clip). Skeleton sync does not auto-select a ready clip when already on T-pose
11. **Bind-pose deltas** — per `modelId` + node name; cleared on model remove/replace. Position `p' = p + Δp`; quaternion `q' = Δq * q`; scale `s' = s * Δs`. Import / Replace / retarget apply accumulated overrides for the active model
12. **Load hoist (US-21)** — `hoistRootTransform` after parse: while the scene has one child, compose non-identity child TRS into the scene (clear child) or peel identity-only wrappers via `attach`; stops at multi-child or geometry/bone nodes

Out of scope: multi-model simultaneous transform; full undo stack (US-10).

## Selection name overlay (US-13)

1. Existing raycast selection writes `$selection.object` (US-4) — no second picking path
2. `SelectionNameOverlay` in `viewport` subscribes to `$selection` and renders the selected `Object3D.name` (tooltip `title` is the same string)
3. Mounted in `EditorPreview` as a floating HTML label (`pointer-events-none`) so it does not block orbit, pick, or the transform toolbar; hidden when selection is null

## Viewport general settings (US-14)

1. `$viewportSettings` (`nanostores` `map`) in `viewport/stores/viewport-settings-store.ts`: `{ axesVisible, axesSize }` with setters; defaults `true` / `AXES_SIZE` (`10`); clamp size to `1`–`50`
2. Settings sidebar **General** section (above Animation) hosts checkbox + metres `Input` (`WorldAxesControls`) — not library sidebar or preview chrome
3. Settings hosts **Axes** and **Model** sections. Model has live editable **model root** position (m), rotation (degrees), and scale as **percent of rest size** (`100` = rest / bind root) via `TransformReadout` whenever a model is loaded — independent of Edit / Move (US-15 / US-21); with an active clip on the focused model, Save stores values on that clip’s `rootPositionByModelId` / `rootRotationByModelId` / `rootScaleByModelId` (scale stored as Three.js factor)
4. `ViewportCanvas` mounts `<WorldAxes axesSize={…} />` only when `axesVisible`; `WorldAxes` rebuilds tick geometry from `axesSize` at runtime (major/minor steps stay in `viewport/constants/world-axes`)
5. Session-only — no persistence. Out of scope: ground-grid toggle, tick-step UI, unit system changes

## Viewport

- Full-bleed R3F `Canvas` with lights; orbit / pan / zoom via `OrbitControls`
- World XYZ axes at the origin with metre rulers on +X/+Y (major `Nm`, minor `0.1` ticks; length from `$viewportSettings.axesSize`; toggle via Settings → General)
- Dark infinite ground grid at `y = 0` (1 m cells, stronger section lines; `viewport/constants/ground-grid`) plus soft contact shadow under the model (`ContactShadows`)
- Edit / Move tool toggle when a model is loaded; TransformControls for selection (Edit) or model root (Move); translate / rotate / scale via preview toolbar + W / E / R (default translate); Edit uses local space, Move uses world space; dragging pauses playback and suspends mixer bindings so tracks cannot overwrite the pose
- Collapsible sidebar docks beside the canvas (`editor-shell`); collapse/expand with labelled chevron controls
- Preview chrome hosts playback + Edit/Move tools + transform mode toolbar (Edit + selection, or Move with a loaded model) + selection name overlay + dirty-only Save / Restore (not the settings sidebar)

## Export (US-5 + US-22 modal/merge + US-7 blend contract)

**Download** opens an **Export** modal. Confirm builds a **zip** in the browser (no server):

1. If there are no loaded models **and** no working clips → disable Download; do not open a useless pack
2. **Merge off (default):** for each loaded model: `GLTFExporter.parse` (`binary: true`) of that scene. **Imported:** plus that model’s **owned** ready clips and **shared** clips that validate against that skeleton (skip conflicted shared; never pack another model’s owned clips). **Created:** mesh scene only (no skeleton / clip attach). Bake each included clip’s own `timeScale` into clones when it is not `1`. For each **shared** library clip with a working `AnimationClip`: animation-only `.glb` (skeleton fallback prefers an imported model when one exists). Owned clips ship only inside their model GLB
3. **Merge on** (US-22; requires ≥2 `previewModelIds`): one `merged.glb` — clone each previewed scene, unique bone-name prefix per model, rename named nodes, parent under a temp root. Export modal supplies **per-model clip picks** (`clipIdByModelId`) and optional **Scene** clip name. Bake: rewrite each pick onto that model’s prefix → **one** multi-character **Scene** clip only (e.g. fight: Attack + HitReact). Omit hidden models; skip per-model GLBs. Also emit animation-only `.glb`s for every **shared** working clip (unprefixed sidecars). Do not emit owned clips as sidecars
4. Filename collisions inside the zip get a numeric suffix. Modal supplies optional basenames: zip archive, merged GLB (merge on), or per-model GLBs (merge off) — sanitized with `resolveZipFileName` / `resolveGlbFileName`; animation-only files keep library clip names
5. Trigger a single download of the zip blob (download attribute uses the chosen zip name). Any exporter or zip failure → user-visible error; no partial archive

A model with no matching clips still ships as a mesh-only `.glb` when merge is off. There are no per-row download buttons; model selection for merge is the library eye / `previewModelIds` set. Clip selection for the Scene bake is the Export modal.

**Blend vs zip (locked):** live blend is viewport playback only (`blendClipId` / `blendWeight` / `blendBaseClip` never enter the exporter). `packModelGlb` / `packMergedModelsGlb` / `packClipGlb` / `downloadExportZip` read each entry’s working `clip` (+ `timeScale` bake) — the same discrete library data as US-5. After **Bake**, the flattened mix replaces the active entry’s `clip` and therefore exports with that clip; without Bake, the zip is unchanged by the overlay.

## FBX import (US-16)

1. File picker `accept` is `.glb,.gltf,.fbx`. `parseGltfFile` stays GLB/GLTF-only
2. `ensureGltfFile` (`import/services`) in model and clip loaders: `.glb`/`.gltf` pass through; `.fbx` → `POST /api/v1/fbx-to-glb` → `File` named `{basename}.glb`
3. Convert **before** skeleton / clip validation. Failures use existing model `error` / clip failed-entry copy
4. API is `@astrojs/vercel` Node serverless (`src/pages/api/v1/fbx-to-glb.ts`, `prerender = false`), not Edge. Server-only `import/adapters/convert-fbx.ts` runs `fbx2gltf` under `os.tmpdir()`; Linux binary via `includeFiles`; Darwin/Windows excluded from the Vercel bundle
5. Body cap matches Vercel payload (typically 4.5MB). No Mixamo convert flags; bone mismatch still uses US-6
6. Zip export (US-5) stays in-browser — convert is the only server round-trip

## Layering rules

- See `.cursor/rules/module-layers.mdc`: `services/` = HTTP; `domain/` = business logic (clip math, framing, bake, pack); `utils/` = shareable helpers / runtime bridges; `adapters/` = loaders, exporter, zip/download, native tools, vendor mappers; store commands in `actions/` next to the store
- Prefer keeping domain logic free of R3F / Tailwind / GSAP; `three` types in `domain/` / `utils/` are OK for 3D code
- UI state for sidebar vs hot-path mixer time: avoid re-rendering the canvas every frame from React state — prefer refs for mixer clock, promote to state only for labelled UI
