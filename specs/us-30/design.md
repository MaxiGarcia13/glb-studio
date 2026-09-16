# US-30 — EditorToolbar (design)

## Placement

1. Full-width **Blender-style** app menu bar at the top of the window (above Library / Preview / Settings columns) — **not** inside `EditorPreview`, not a floating viewport overlay.
2. `EditorToolbar` is a `menubar` with text triggers:
   - **File** — `ActionMenu` dropdown (New model, New animation, Import, Export)
   - **Settings** — `ActionMenuPanel` dropdown with world-axes controls
3. Mount from [`src/pages/index.astro`](../../src/pages/index.astro) as its own island above the flex row of asides + preview.
4. Reuse chrome tokens (`bg-surface`, `border-border`, `Button` ghost, `ActionMenu`); one open menu at a time.

## File actions (`ActionMenu`)

| Control       | Wire to                                                         | Remove from                               |
| ------------- | --------------------------------------------------------------- | ----------------------------------------- |
| New model     | `createEmptyModel`                                              | Models header (`NewModelButton`)          |
| New animation | `startNewAnimation(scene)` with default `ownerModelId: null`    | Shared header (`ClipNewAnimation`)        |
| Import        | new content-routing entry (below); open via `useGltfFilePicker` | Models `ModelImport`, Shared `ClipImport` |
| Export        | open existing `ExportModal` (`canExport` gate)                  | Settings aside `DownloadExport`           |

Keep model-row **Add animation** modal unchanged (owned create / import / clone).

## Import routing

Per picked file (after `ensureGltfFile` / parse):

1. If scene has skinned mesh + skeleton → `importModelFiles` path (or shared helper that already registers owned embedded clips).
2. Else if `gltf.animations.length > 0` → shared clip import (`importClipFiles` / equivalent with `ownerModelId: null`).
3. Else → error for that file; continue batch.

Do not ask the user which destination. Files with **both** mesh and clips follow the model path (owned clips), matching today’s model upload.

## Settings (axes)

1. Host `WorldAxesControls` in the **Settings** menu panel; keep `$viewportSettings` (`axesVisible` / `axesSize`) and `WorldAxes` mount behavior.
2. Remove the Axes block from `EditorSettingsSidebar`; leave Model / Animation / Part inspector as they are.

## Non-goals

No change to zip / merge / ownership export contracts. No full Blender workspace tabs / secondary tool row — File + Settings only for this story.
