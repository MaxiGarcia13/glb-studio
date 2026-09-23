# US-46 — Color-map undo + library texture rows (design)

## Approach

### 1. Undoable command: `materialColorMap`

Add a session stack id next to `createScene` / `saveKeyframe`:

| Field      | Role                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| `modelId`  | Library model owning the mesh                                               |
| `meshUuid` | Stable `Object3D.uuid` of the Mesh / SkinnedMesh                            |
| `before`   | Snapshot: `map` clone or `null`, plus alpha flags needed to restore cutouts |
| `after`    | Same shape for the committed map                                            |

**Apply path (create + skinned):**

1. Resolve target material (created part or `resolveSkinnedTextureTarget`).
2. **Clone** the live `material.map` into `before` (or `null`) _before_ dispose.
3. Decode / assign via existing helpers (`replaceColorMap`, `clearColorMap`, `replaceMaterialColorMapFromFile`).
4. Clone the new live map into `after` (or `null` on clear).
5. `pushUndoableCommand({ id: 'materialColorMap', … })`.

**Undo / redo:** resolve mesh by uuid under `modelId`’s scene; assign from snapshot with `restoreMaterialColorMap` **without** disposing stack-owned textures. Dispose clones only when the stack entry is dropped (`pushUndoableCommand` clears redo → `disposeUndoableCommandResources`; `clearUndoStack` same). If the live material still shows a stack clone, **adopt** a private clone first. Live commits use `assignMaterialColorMapLive` + `releaseOrphanColorMap` (skip dispose when the previous map is still on the stack).

**Wire call sites:** US-39 prep Apply, `PartTextureTool` clear, `SkinnedTextureTool` apply/clear, and Library clear (this US).

### 2. Revision signal

Bump a small store (e.g. `$materialMapsRevision` or reuse / extend an existing create revision carefully) after every apply / clear / undo / redo so Library rows and toolbar pressed state stay in sync. Do not rely on mutating `material.map` alone to re-render React.

### 3. Library rows (skinned)

In `LibraryModel` (under `editor-library-sidebar` → `library-models`), when `isSkinnedLibraryModel`:

- List skinned meshes with `findMeshStandardMaterial(mesh)?.map`.
- Render nested rows (same density as bone / clip rows): label + clear control.
- Clear calls the shared undoable clear action.
- Include rows in `hasNested` / chevron logic.

Created models: leave PartOutliner + create toolbar as the primary clear UX unless a tiny “has map” affordance is trivial; not required for MVP of this US.

### 4. Gadgets / disposal

- Snapshot clones must copy enough of the canvas / ImageBitmap-backed texture that restore looks identical (including `flipY`, color space, name, alpha userdata).
- Document: clearing then undoing reattaches the clone; replacing twice leaves intermediate maps only on the stack until pruned.

## Non-goals

- No change to US-39 imported/created gate for prep.
- No durable undo; no server texture store.
- No automatic Kenney skin registry.
