# US-30 — File / Settings floating toolbar (design)

## Placement

1. New floating chrome on the viewport (likely top-left, owned by `editor-preview` positioning — same inset / mobile stack rules as other floating toolbars).
2. One `FloatingToolbar` (or a thin wrapper with two labeled groups) with sections **File** and **Settings**.
3. Reuse `Button` (`ghost` / `primary`), icon-only where it matches existing chrome; axes controls need checkbox + number `Input` (may expand the Settings group or open a compact popover — prefer inline if it stays readable).

## File actions

| Control       | Wire to                                                      | Remove from                               |
| ------------- | ------------------------------------------------------------ | ----------------------------------------- |
| New model     | `createEmptyModel`                                           | Models header (`NewModelButton`)          |
| New animation | `startNewAnimation(scene)` with default `ownerModelId: null` | Shared header (`ClipNewAnimation`)        |
| Import        | new content-routing entry (below)                            | Models `ModelImport`, Shared `ClipImport` |
| Export        | open existing `ExportModal` (`canExport` gate)               | Settings aside `DownloadExport`           |

Keep model-row **Add animation** modal unchanged (owned create / import / clone).

## Import routing

Per picked file (after `ensureGltfFile` / parse):

1. If scene has skinned mesh + skeleton → `importModelFiles` path (or shared helper that already registers owned embedded clips).
2. Else if `gltf.animations.length > 0` → shared clip import (`importClipFiles` / equivalent with `ownerModelId: null`).
3. Else → error for that file; continue batch.

Do not ask the user which destination. Files with **both** mesh and clips follow the model path (owned clips), matching today’s model upload.

## Settings (axes)

1. Move `WorldAxesControls` (or equivalent) into the toolbar Settings section; keep `$viewportSettings` (`axesVisible` / `axesSize`) and `WorldAxes` mount behavior.
2. Remove the Axes block from `EditorSettingsSidebar`; leave Model / Animation / Part inspector as they are.

## Non-goals

No change to zip / merge / ownership export contracts. No Blender top-menu recreation.
