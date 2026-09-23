# Tech debt

Internal cleanup. No changelog unless user-visible product changed. Tick only after the change is in.

Do not start post-MVP stories (US-8) from this file.

## Dead code

- [x] Remove unused `loadModel` in `src/modules/viewport/stores/model-store.ts` (alias of `importModelFiles([file])`) and drop it from `src/modules/viewport/index.ts`
- [x] Remove unused `resetModel` (clears the whole library; no caller) and drop it from the viewport barrel
- [x] Remove unused `getActiveMixer` in `src/modules/animation/utils/mixer-session.ts` (`setActiveMixer` stays)
- [x] Delete `src/components/collapsible/collapsible-hook.tsx` — duplicate of `useCollapsible` in `collapsible-context.tsx`; barrel already exports the context version only
- [x] Wire `ManIcon` into `LibraryModelTitle` (requirements: model header shows `ManIcon` next to the name)
- [x] Drop unused `AssetEntry` `variant="card"` — no caller passes it; keep `row` only (types + branch in `asset-entry.tsx`)
- [x] Remove unused `pickObjectAtPointer` in `src/modules/viewport/domain/object-pick.ts` — callers use `pickObjectAcrossRoots` only
- [x] Remove unused `computeModelFraming` in `src/modules/viewport/domain/model-framing.ts` — callers use `computeScenesFraming` only
- [x] Remove unused `getBlendWeight` in `src/modules/animation/utils/mixer-session.ts` (`setBlendWeight` stays)
- [x] Remove deprecated create-parent aliases with no callers: `canParentPart`, `parentPart`, `groupPartsUnder` in `src/modules/create/domain/parent-part.ts` (live paths: `canAttachUnder` / `attachUnder` / `attachAllUnder`)
- [x] Remove unused `removeEmptyPartGroup` in `src/modules/create/domain/create-part-group.ts` — ungroup uses `dissolveCreateGroups`
- [x] Un-export internals only used in-file: `listKits` → private to `kit.ts` (`listStarterKits` stays public); `resolveInsertKeyTime` → non-export in `keyframe-crud.ts`

## Unused public barrels

Callers already use deep paths. Trim unused re-exports; do not migrate imports unless a later change needs the barrel.

- [x] `src/modules/viewport/index.ts` — nothing imports `@/modules/viewport`; keep only symbols that should be the module’s public API, or delete the barrel if it stays unused
- [x] `src/modules/animation/index.ts` — editor-shell only imports `ClipSelector`, `PlaybackControls`, `useClipTimelineScrubber`, `ClipTrimInputs`, `SpeedControl`. Drop the rest from the barrel (`ClipImport`, `ClipLibrary`, `$clips`, playback/store actions, …). Those symbols stay via `stores/clip-store` / component files
- [x] `src/components/timeline-scrubber/index.ts` — export `TimelineScrubber` (and props type if needed). Keep `durationToFrameCount` / `frameToTime` / defaults private to the package

## Duplicated patterns

Not copy-pasted files. Extract only if the helper stays small.

- [x] Shared GLB parse helper for `loadModelFromFile` and `loadClipsFromFile` (extension check, blob URL, `GLTFLoader` Promise). Keep domain validation in each adapter
- [x] `replaceClip` should call `toEntry()` instead of inlining the same `ClipEntry` shape
- [x] `CollapsibleAside`: the closed path already returns `OpenButton`, so `[marginDirection]: sidebarOpen ? 0 : calc(-1 * width)` never runs. Remove the dead branch, or finish the slide animation

## Not debt

- Timeline lives in `src/components/timeline-scrubber/` only (the animation-module copy is gone)
- `ModelLibrary` / `ClipLibrary` composing `AssetEntry` + `useGltfFilePicker` is reuse
- `LibraryModelActions` / `AssetEntryActions` both build `ActionMenu` item lists — shared primitive, intentional specialization
- `SpeedControl` native range vs `Input` is intentional (slider + `1.0x` readout)
- Camera, grid, axes, selection, GLTF, and timeline constants each have a single owner
- Kit registry is live (US-27 shipped); optional clothed block kit is deferred content-only if ever wanted
- `part-kind.ts` and kit recipe files (`simple-building`, `block-robot`) are large data registries — split only if editing becomes painful
- `mixer-session.ts` / `transform-readout-store.ts` — medium size; split when next touching blend vs transport or readout vs apply
- Export files under ~150 lines (`download-export-zip`, `model-glb`, modal pieces) — do not split by line count; cognitive load is the format×layout×unit matrix (see Export sections above)

## Complex splits

Extract only when the next edit would otherwise be painful. Prefer one concern per file; keep call sites stable.

- [x] Split keyframe domain into `keyframe-hold.ts` / `keyframe-crud.ts` / `keyframe-interpolation.ts` (+ shared `keyframe-sample.ts`); callers import deep paths — no barrel
- [x] Thin `save-keyframe.ts` / `retarget-clip.ts` (~332 each): move pure bind-pose commit shaping and retarget scale/hips failure helpers into `domain/`; leave store wiring in actions

## Export — priority cleanup

Product surface is already large (format × layout × unit × imported/created × clips × skins). Prefer store-free packers and one naming helper before the next skins/export US. No product behavior change; keep US-49 / US-36 acceptance green.

### Dead / redundant export symbols

- [x] Drop unused `EXPORT_ZIP_FILE_NAME` in `src/modules/export/utils/file-name.ts` (nothing imports it; callers use `defaultExportZipFileName`)
- [x] Drop or un-export `resolveGlbFileName` — production uses `resolveExportFileName`; if kept, it is tests-only and should not be a public alias
- [x] Collapse `collectImportedModelAnimations` / `collectCreatedModelAnimations` in `model-glb.ts` — both only map `collectModelExportClips` → `bakeTimeScale`; created vs imported difference already lives in `collectModelExportClips`

### Store-free pack orchestration

- [x] Treat `downloadExportZip` as an action/orchestrator: pass `models`, `clips`, `groups`, active model (skeleton fallback), and zip options in — stop reading `$model` / `$clips` / `$modelGroups` / `$activeModel` from domain
- [x] Keep pack helpers store-free: `packFolderModelEntries` and `attachSessionSkinsForExport` take wardrobe (or skin list) as arguments instead of calling `getSessionSkinWardrobe`; hook / thin action resolves store → args
- [x] Update `useExportZip` (and any direct callers) to gather store snapshot then call the orchestrator; unit tests pass fixtures without nanostores

### Shared unique-name helper

- [x] One small `uniqueTakenName` (or equivalent) for the `-2` / `-3` suffix loop shared by `uniqueFileName`, `uniquePathSegment`, and `uniqueClipName` in `merge-namespace.ts` — keep public wrappers if call sites stay clearer
- [x] Prefer `stripExportExtension` at export call sites that still use `stripGlbExtension` for basenames (modal defaults, merge prefix, pack file names); keep `stripGlbExtension` only where GLB-only is intentional, or fold into the export-aware helper

### Defensive zip naming

- [ ] Decide and document: either rely on orchestrator uniquify **or** `buildZipArchive` uniquify — not both silently. Prefer single owner + assertion/test that collisions are resolved before zip; drop the second pass if redundant

## Export — when next touching

Do **not** start these for neatness. Extract when the next export/skins US would otherwise make `download-export-zip` / folder pack painful.

- [ ] Flat vs folders layout strategy (or two small packers) so group/single path rules are not re-implemented in the orchestrator — only when adding another layout or skin packing rule
- [ ] Revisit export ↔ create coupling (`attachSessionSkinsForExport`, folder PNG skins) when US-47 (Skin editor) or further wardrobe export rules land; keep contract in `specs/current/design.md` Export section

## Create — when next touching

Large but owned. Split only when the next edit would otherwise be painful (same rule as Complex splits).

- [ ] `material-color-map-undo.ts` (~300) — split dispose / clone / apply / stack-ownership helpers if the next skins undo change mixes concerns further
- [ ] `create-part-clipboard.ts` (~318) — split snapshot vs instantiate if clipboard paste / hierarchy work grows
- [ ] Texture prep modal pieces (`texture-prep-crop-editor`, modal shell) — already folder-split for draft hook; further split only if crop UI vs apply lifecycle collide in one PR

## Unit tests

Prefer pure `domain/` / `utils/` over React/R3F. Tests live under `tests/unit/` at the repo root (kebab-case files, mirror `src/` layout). Tick only after the suite is green in CI.

### Harness

- [x] Add Vitest + `npm run test` / `test:watch`; `tests/unit/` + `@/` alias; CI job runs unit tests

### P0 — pure helpers

- [x] Commands: chord match, resolve id, typing target, group-by-category, format chord, chord key parts

- [x] Timeline frames + `toTimelineTime` (edge: NaN, loop wrap, pause clamp)
- [x] Euler degrees wrap / rad↔deg
- [x] Export file-name sanitize / unique / glb+zip resolve; `preserveGltfExtension`
- [x] Clip validate (`splitTrackName`, skeleton mismatch counts) + `isReadyClip` / `toEntry*` shapes
- [x] `isExportableModel` + `resolveExportUnits`; `parseModelGroupManifest` reject paths
- [x] Axis ruler ticks + labels; hips name / mapping helpers

### P1 — Three fixtures

- [x] Bone registry labels/auto-map + Mixamo vendor suggest/displayName
- [x] `computePositionScaleRatio` median / null
- [x] `remapClipTracks` + hips rebase + bind-pose delta/rebase (synthetic tracks)
- [x] `bakeBlendClip` weight/duration; `nextObjectName`
- [x] `convertFbxToGlb` validation (400/413) with mocked converter

### P2 — remaining pure domain

- [x] `command-stack`: push / undo / redo / redo-branch drop
- [x] `trimClipWindow` + `bakeTimeScale` (synthetic tracks; duration / time shift)
- [x] `writeNodeKeyframe` hold-plateau path (CRUD + interpolation already covered)
- [x] `canAttachUnder`: cycle / root / hierarchy reject paths
- [x] `buildUniqueModelPrefix` + namespace helpers in `merge-namespace.ts`
- [x] `isUsableSkinnedModelScene` / `isUsableCreatedModelScene`; `isNodeNameTaken`

### Out of scope here

React islands, R3F hooks, mixer/store actions, full GLTF import routing — revisit after P2.
