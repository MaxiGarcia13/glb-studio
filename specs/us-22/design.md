# US-22 — Export modal + merge (design)

## UX

1. Settings sidebar **Download** opens `ExportModal` (`Modal` + confirm)
2. Modal copy explains separate vs merge; checkbox **Merge visible models** when `previewModelIds.length >= 2`
3. **Merge on — Scene animations:** one clip `Select` per previewed model (owned ready + fitting shared; “None” = bind pose). Defaults from `resolveActiveClipIdForModel`. Editable **Scene clip name** (default `Scene`)
4. **File names** section: zip basename (always); merged basename when merge on; one input per loaded model when merge off
5. Confirm → `downloadExportZip({ mergeModels, zipFileName, mergedFileName, modelFileNames, clipIdByModelId, sceneClipName })`

## Pack rules

### Separate (merge off)

Unchanged US-5 / ownership rules in `packModelGlb` + shared-only `packClipGlb`.

### Merge on

1. Resolve models whose ids are in `previewModelIds` (order = preview list order)
2. If fewer than 2 → treat as separate (UI should not offer merge)
3. Clone each previewed scene (`SkeletonUtils.clone`), assign unique bone prefix, rename named nodes, parent under `merged`
4. `buildMergeExportClips`: for each model’s picked clip id, rewrite tracks onto that prefix; build **one Scene clip only** with all picks’ tracks (fight take) — no solo per-model clips
5. Do **not** auto-combine same-name library clips across models unless the user picked them into Scene
6. Animation-only zip entries: every **shared** clip with `clip !== null` (unprefixed sidecars). Owned never as sidecars on merge

## Layers

- `export/domain/merge-namespace.ts` — prefixes, clip choices, scene bake
- `export/domain/merged-glb.ts` — merge pack
- `export/domain/zip-download.ts` — options + branch
- `export/components/export-modal.tsx` — UI
- `editor-shell/.../download-export.tsx` — open modal
