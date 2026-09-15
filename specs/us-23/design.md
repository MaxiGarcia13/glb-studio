# US-23 — Create empty model (design)

## Goal

**New model** always starts from scratch (empty scene). No modal. Primitives (US-24), snap, hierarchy, optional kits, and textures arrive later via the same `create` registries.

## Module boundary

New domain **`create`** under `src/modules/create/`:

| Layer | Owns |
|-------|------|
| `domain/` | `PartKind` registry, optional kit recipes (US-27), spawn/duplicate helpers, geometry rebuild from params |
| `actions/` | `createEmptyModel`, duplicate/delete part |
| `components/` | New model button, part inspector (shell may mount these) |

Do **not** put geometry factories inside `animation/`. `viewport` keeps raycast, TransformControls, selection. `export` keeps packing `model.scene` unchanged aside from validation differences at load time.

## Data model

- `ModelEntry.source: 'imported' | 'created'`
- Created entries: no file blob; dispose must not revoke a missing URL
- Parts are children of `model.scene`; each mesh `name` is the stable part id for overlay + inspector

## Registries (growth seams)

```text
PartKind: id → { createMesh(params), defaultParams, InspectorFields }
Kit:      id → { label, description, parts: PartRecipe[] }  // US-27+; not used by New model
PartRecipe: { kind, name, position, rotation, scale?, params, color }
```

MVP kinds: `box`, `sphere`, `cylinder`, `capsule`.  
New model: always empty scene via `createEmptyModel()`.

## Validation

- `loadModelFromFile` path: unchanged skinned + skeleton checks
- `createEmptyModel`: skip those checks; mark `source: 'created'`
- Export: `packModelGlb` serializes the scene; no skeleton required for created models

## Edit / Save

Reuse US-15 Edit + Save / Restore for part TRS. Save with no active clip commits local TRS on the mesh (scene graph).

## Inspector

When selection is a mesh belonging to the focused created model:

- Color → `MeshStandardMaterial.color`
- Size → rebuild geometry from kind params (keep material + TRS)

## UX

1. Models section **New model** (Plus) → `createEmptyModel()` immediately
2. User adds parts via US-24 palette (or interim create tools when available)
3. Part inspector in Settings — prefer Settings so preview stays uncluttered
4. Duplicate / Delete near the inspector

## Non-goals

No kit picker modal. No parallel debug canvas. No Mixamo bone prefixes. No texture maps in this US.
