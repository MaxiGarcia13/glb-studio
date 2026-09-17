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
- [x] File → Export control + blob download of the zip
- [x] Disable / error when nothing to pack; no partial zip on exporter failure

## US-22 — Export modal + multi-model pack

**Shipped** — folded into `current/` (multi-model opt-in superseded by US-26 groups). See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `packMergedModelsGlb` + `downloadExportZip` (group / single units)
- [x] On multi-model group: per-model clip picks → Scene bake only; shared also as unprefixed sidecars
- [x] `ExportModal` + File → Export opens modal (no Merge checkbox — US-26)
- [x] Filename inputs: zip + group / per-model basenames; Scene clip + per-model Selects when groups exist
- [x] Manual verify separate vs grouped / fight Scene bake

## US-13 — Selection name overlay

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `SelectionNameOverlay` reads `$selection` and shows `Object3D.name`
- [x] Mounted in `EditorPreview` as a non-interactive floating label; hidden when nothing selected

## US-29 — Rename selected bone or mesh

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Domain `renameNodeInClipTracks` + bind-pose key move; viewport `renameSelectedObject` (unique in scene; owned clips only)
- [x] Settings **Name** field wired with `useAssetEntryRename` / `AssetEntryRenameInput`
- [x] Overlay updates on commit; shared clips untouched

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
- [x] **Navigate** tool (`ArrowsHorizontalIcon`, first button): hand-tool pan travel; no gizmo / pick; default remains Edit

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

## US-21 — Whole-model rotate / scale + Settings root rotation

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] Move: translate / rotate / scale on model root; toolbar + W / E / R while Move active
- [x] Settings rotation XYZ (0–360°) + sync from loaded root
- [x] `rootRotationByModelId` Save / apply / mixer wiring
- [x] Load-time hoist of wrapper TRS onto `gltf.scene`

## US-23 — Create empty model + part edit

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `create` module + `PartKind` / `Kit` registries; `ModelEntry.source`
- [x] `createEmptyModel()` + File → New model (no kit modal); skip skeleton validation
- [x] Create toolbar (color / duplicate / delete) + Settings part size inspector
- [x] Edit Save / Restore for created parts; beginner hint; zip packs created `{model}.glb`
- [x] Ground-origin spawn + named parts; import path still requires skinned mesh + skeleton

## US-24 — Primitive palette + add part

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `plane` PartKind + `addPart(modelId, kindId)` (unique names, Edit + select)
- [x] Add-part palette on created-model create toolbar; hidden for imported focus
- [x] Added parts reuse US-23 inspector / duplicate / delete / Save–Restore; export packs scene
- [x] Extra primitives: cone, torus, triangle, polygon (`sides`), circle, ring, tetrahedron, octahedron, icosahedron, dodecahedron

## US-25 — Grid and rotation snap

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `$viewportSettings` snap fields + setters (session-only; defaults off / `0.1` m / `15°`)
- [x] `SnapControls` in top Settings menu; labelled checkboxes + step inputs
- [x] TransformControls built-in snaps for created models only (Edit + Move); imported ignore

## US-26 — Hierarchy, outliner, group + export-via-group

**Shipped** — folded into `current/`. See [`CHANGELOG.md`](../CHANGELOG.md).

- [x] `parentPart` / `attachUnder` / empty create groups; cycle guard; world preserve
- [x] `PartOutliner` (indent, collapse, click + Shift+click select); `$createPartsRevision`
- [x] Multi-selection store (`kind: parts | models`); Shift+click library + viewport; selection highlight
- [x] Context-menu Group / Ungroup for parts and models; remove Settings Parent + toolbar Unparent
- [x] Export packs model groups as one GLB; ungrouped separate; Merge checkbox removed

## Open deltas

| US                                     | Status                    | Tasks                                       |
| -------------------------------------- | ------------------------- | ------------------------------------------- |
| **US-27** — Additional kits            | in progress               | [`specs/us-27/tasks.md`](../us-27/tasks.md) |
| **US-28** — Part color maps (textures) | not started (after US-23) | [`specs/us-28/tasks.md`](../us-28/tasks.md) |
| **US-8** — Morph-target editing        | post-MVP, not started     | [`specs/us-8/tasks.md`](../us-8/tasks.md)   |
| **US-9** — Graph / curve keyframe UI   | post-MVP, not started     | [`specs/us-9/tasks.md`](../us-9/tasks.md)   |
| **US-10** — Full undo / redo           | post-MVP, not started     | [`specs/us-10/tasks.md`](../us-10/tasks.md) |

## Tech debt

Internal cleanup (unused exports, leftover aliases, small extracts). See [`specs/tech-debt.md`](../tech-debt.md).
