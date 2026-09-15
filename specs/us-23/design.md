# US-23 — Create model from kits (design)

## Goal

Guided creation first: pick a kit, then edit parts. Primitives, snap, hierarchy, more kits, and textures arrive in later US via the same registries.

## Module boundary

New domain **`create`** under `src/modules/create/`:

| Layer                       | Owns                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `domain/`                   | `PartKind` registry, kit recipes, spawn/duplicate helpers, geometry rebuild from params        |
| `actions/` or store helpers | `createModelFromKit`, duplicate/delete part (may live next to viewport model store if tighter) |
| `components/`               | Kit picker modal, part inspector (shell may mount these)                                       |

Do **not** put kit names or geometry factories inside `animation/`. `viewport` keeps raycast, TransformControls, selection. `export` keeps packing `model.scene` unchanged aside from validation differences at load time.

## Data model

- Extend `ModelEntry` with `source: 'imported' | 'created'`
- Created entries: no file blob required (or empty / sentinel `blobUrl`); dispose must not revoke a missing URL
- Parts are children of `model.scene` (or a single `parts` group under the scene); each mesh `name` is the stable part id for overlay + inspector

## Registries (growth seams)

```text
PartKind: id → { createMesh(params), defaultParams, InspectorFields }
Kit:      id → { label, description, parts: PartRecipe[] }
PartRecipe: { kind, name, position, rotation, scale?, params, color }
```

MVP kinds: `box`, `sphere`, `cylinder`, `capsule`.  
MVP kits: `empty`, `simple-car`, `block-figure`.

Later US only add registry entries (or thin kind modules) — avoid special-casing “car” in the viewport.

## Validation

- `loadModelFromFile` path: unchanged skinned + skeleton checks
- `createModelFromKit`: skip those checks; mark `source: 'created'`
- Export: `packModelGlb` already serializes the scene; no skeleton required for created models

## Edit / Save

Reuse US-15 Edit + Save / Restore for part TRS. Save with no active clip commits local TRS on the mesh (scene graph). Created models typically have no clips; Hold Pose path stays unused unless the user later adds animation.

## Inspector

When selection is a mesh belonging to the focused created model:

- Color → `MeshStandardMaterial.color`
- Size → rebuild geometry from kind params (keep material + world/local TRS)

## UX

1. Models section action: **New model** → modal with three kits (icon + short label + one-line help)
2. Confirm → factory builds scene → append to `$model.models`, preview + focus
3. Part inspector in Settings (General or a **Create** section) or preview chrome — prefer Settings so preview stays uncluttered
4. Duplicate / Delete as labelled controls near the inspector (keyboard shortcuts can wait)

## Non-goals

No parallel debug canvas. No hardcoding Mixamo bone prefixes. No texture maps in this US.
