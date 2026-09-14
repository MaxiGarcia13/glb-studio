# Tasks — current

MVP status board. Detailed work lives in the open delta’s `tasks.md`; tick acceptance in `current/requirements.md` when a US ships and the delta is folded.

## Bootstrap (done when specs + AGENTS exist)

- [x] `AGENTS.md` + `specs/current/` + `CHANGELOG.md` + `specs/us-1/` … `specs/us-10/`

## Dependencies (before US-1 code)

- [x] Add `three`, `@react-three/fiber`, `@react-three/drei`, and Three type packages as needed

## US-1 — Model load & viewport

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Editor island + full-screen R3F viewport
- [x] Model upload + load into scene
- [x] Orbit / pan / zoom; empty and error states
- [x] Collapsible sidebar shell (`EditorSidebar` / `EditorPreview`)

## US-2 — Animation library & playback

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Multi-file animation import → clip library with skeleton validation
- [x] Clip selector + Play / Pause / Stop / loop
- [x] `AnimationMixer` on character root + timeline scrubber tied to mixer time
- [x] Track / bone mismatch shows a user-visible error (no silent retargeting)
- [x] Sidebar clip list with per-entry Replace / Remove; active clip picker lives in preview chrome

## US-11 — Model library

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Session model library (`models[]` + `activeModelId`); viewport still reads one `scene`
- [x] Multi-file model import; failed files do not join the library
- [x] Sidebar model list with Replace / Remove and a distinct previewed row
- [x] Switching preview: swap viewport graph, re-frame camera, rebind mixer, `syncClipsToSkeleton`
- [x] Remove previewed model → next loaded model or empty overlay
- [x] Clip import remains gated on a previewed model

## US-3 — Clip trim & time scale

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Start / End Time inputs for active clip
- [x] Clone → working window trim → replace working library entry
- [x] Session recoverability of pre-trim clip (`sourceClip` + re-trim from source)
- [x] Rebind mixer action after trim; update scrubber duration
- [x] Speed multiplier slider → per-clip `timeScale` (live via `mixer.timeScale` for the active clip)

## US-4 — Keyframe edit

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Pause / scrub from US-2 at an arbitrary timestamp
- [x] Raycast selection of bone / mesh; TransformControls attach + orbit conflict handling
- [x] Transform mode toolbar (translate / rotate / scale + W / E / R); gizmo in local space
- [x] “Hold Pose to End” + “Restore Pose” in preview (visible only when pose is dirty)
- [x] Capture local TRS; find/create Vector / Quaternion tracks; hold plateau playhead → clip end
- [x] Restore discards unsaved pose and re-applies clip at playhead

## US-5 — Zip export

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Bake helper for `timeScale !== 1` (clone clips; scale times / duration)
- [x] `GLTFExporter` adapter: model scene + matching working clips → `.glb`
- [x] `GLTFExporter` adapter: animation-only (empty/minimal scene + one working clip) → `.glb`
- [x] Zip helper; numeric suffix on filename collisions
- [x] “Download” sidebar control + blob download of the zip
- [x] Disable / error when nothing to pack; no partial zip on exporter failure

## US-13 — Selection name overlay

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `SelectionNameOverlay` reads `$selection` and shows `Object3D.name`
- [x] Mounted in `EditorPreview` as a non-interactive floating label; hidden when nothing selected

## US-14 — Viewport general settings (axes)

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `$viewportSettings` store (`axesVisible`, `axesSize`) under `viewport/stores`
- [x] General section in Settings sidebar (checkbox + metres input)
- [x] Conditionally render `WorldAxes` from `axesVisible`; length from `axesSize`

## US-12 — Rename library entries

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `renameModel` / `renameClip` store handlers (stable ids; clip syncs embedded `AnimationClip.name`; empty names rejected)
- [x] `AssetEntry` inline rename (Finder-style basename select; restore `.glb`/`.gltf` if omitted on commit)
- [x] Wired from `ModelLibrary` and `ClipLibrary`; zip basenames follow renames

## US-6 — Cross-rig retargeting

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Bone / track alias registry + vendor adapters (`bone-vendors/`); suggestions only — Apply required
- [x] Retarget modal + mapping UI; This model (shared → owned copy / owned → in place) | All models apply scope; keep clip name; model-header conflict picker
- [x] Clip remap → playable working clip; unmapped bones drop tracks; empty map errors without corrupting pose
- [x] Library Retarget on mismatched clips (including after previewed-model switch)

## US-15 — Edit / Move tools + bind-pose save

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Edit / Move tool toggle; Move = world translate on model root
- [x] Dirty Save / Restore; bind-pose commit (no clip) + Hold Pose (active clip) + root translation (Move)
- [x] Bind-pose deltas rebase library clips and apply on import / replace / retarget
- [x] Auto-Restore on tool switch and selection change while dirty
- [x] Settings General: editable model-root X / Y / Z (clip-scoped when a clip is active)
- [x] Active Clip **T-pose** option restores rest / bind pose

## US-7 — Multi-clip blending

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Dual-action mixer + weighted blend overlay (`blendClipId` / `blendWeight` / `blendBaseClip`)
- [x] New animation draft from scratch; library list selection; click-again → T-pose
- [x] Settings Blend collapsible: partner, weight, Bake, Reset (viewport-only until Bake)
- [x] Export stays discrete library clips (US-5); Bake commits mix into the active clip before pack

## US-16 — FBX import via convert API

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `@astrojs/vercel` + `fbx2gltf`; editor page prerendered; Linux binary `includeFiles` / Darwin+Windows `excludeFiles`; Vite SSR external
- [x] `POST /api/v1/fbx-to-glb` (`prerender = false`): multipart `file`, size/type checks, convert in `/tmp`, return GLB
- [x] Server-only `import/adapters/convert-fbx`; client `ensureGltfFile` in model + clip loaders (import + replace)
- [x] File picker `accept` includes `.fbx`; converted entries named `{basename}.glb`

## US-17 — Retarget position scale

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `sourceBindLengths` on clip load; median rest-pose length ratio at Apply
- [x] Clear Apply error when no usable pairs; US-6 scopes unchanged
- [x] Ratio feeds hips position remap (US-18)

## US-18 — Retarget hips bind-frame

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `sourceBindFrames` (local pos + parent world quat) on clip load
- [x] Hips-only `.position`; delta-from-bind + parent-quat rebase; hips quat rebase
- [x] Fail clearly if hips/frames missing while positions exist

## US-19 — Nested library + clip ownership

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `ownerModelId` on clips; Shared vs model-owned import / create / clone
- [x] Nested Models + Shared Animations UI with iconized actions
- [x] Retarget This model (shared → owned same-name copy; owned → in place) / All models (partial success); model-header multi-conflict picker; same-name ready owned suppresses shared Needs retarget
- [x] Export: owned + validating shared; skip other-owned and conflicted shared

## US-20 — Multi-model preview + clip select

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `previewModelIds` + eye toggle; new loads join the preview; camera frames union AABB
- [x] Selection: `activeSharedClipId` + `activeClipByModelId`; owned select is per-model; shared select clears per-model
- [x] Shared playback: same-name ready owned override per model (`resolveActiveClipIdForModel`)
- [x] Model load / select does not auto-select a clip
- [x] Viewport renders multiple model scenes; one `AnimationMixer` per previewed model

## Open deltas

| US                                            | Status                | Tasks                                       |
| --------------------------------------------- | --------------------- | ------------------------------------------- |
| **US-8** — Morph-target editing               | post-MVP, not started | [`specs/us-8/tasks.md`](../us-8/tasks.md)   |
| **US-9** — Graph / curve keyframe UI          | post-MVP, not started | [`specs/us-9/tasks.md`](../us-9/tasks.md)   |
| **US-10** — Full undo / redo                  | post-MVP, not started | [`specs/us-10/tasks.md`](../us-10/tasks.md) |

## Tech debt

Internal cleanup (unused exports, leftover aliases, small extracts). See [`specs/tech-debt.md`](../tech-debt.md).
