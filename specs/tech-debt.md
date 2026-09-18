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

## Unit tests

Prefer pure `domain/` / `utils/` over React/R3F. Tests live under `tests/unit/` at the repo root (kebab-case files, mirror `src/` layout). Tick only after the suite is green in CI.

### Harness

- [ ] Add Vitest + `npm run test` / `test:watch`; `tests/unit/` + `@/` alias; CI job runs unit tests

### P0 — pure helpers

- [x] Commands: chord match, resolve id, typing target, group-by-category, format chord, chord key parts

- [x] Timeline frames + `toTimelineTime` (edge: NaN, loop wrap, pause clamp)
- [x] Euler degrees wrap / rad↔deg
- [ ] Export file-name sanitize / unique / glb+zip resolve; `preserveGltfExtension`
- [ ] Clip validate (`splitTrackName`, skeleton mismatch counts) + `isReadyClip` / `toEntry*` shapes
- [ ] `isExportableModel` + `resolveExportUnits`; `parseModelGroupManifest` reject paths
- [ ] Axis ruler ticks + labels; hips name / mapping helpers

### P1 — Three fixtures

- [ ] Bone registry labels/auto-map + Mixamo vendor suggest/displayName
- [ ] `computePositionScaleRatio` median / null
- [ ] `remapClipTracks` + hips rebase + bind-pose delta/rebase (synthetic tracks)
- [ ] `bakeBlendClip` weight/duration; `nextObjectName`
- [ ] `convertFbxToGlb` validation (400/413) with mocked converter

### Out of scope here

React islands, R3F hooks, mixer/store actions, full GLTF import routing — revisit after P0/P1.
