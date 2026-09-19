# US-33 — Design (skinned starter kit)

## Goal

Give beginners a **skinned** character from **From kit** that reuses the imported-model pipeline (bones, helper, clips, export) with minimal new engine surface.

## Kit model extension

Today `Kit` is mesh recipes (`parts` + optional `groups`). Extend without breaking house / empty:

```ts
type Kit
  = | { id; label; description; parts; groups? } // existing (created)
    | { id; label; description; skinnedAsset: SkinnedKitAsset }; // new
```

`SkinnedKitAsset`:

- `url` or bundler URL to a `.glb` under `public/kits/` (locked path)
- Optional `defaultFileName` for the library row (e.g. `Block robot.glb`)
- Documented bone contract (humanoid names aligned with bone registry where practical)

`listStarterKits` / From kit modal: unchanged UX; skinned kits appear beside mesh kits.

**Dual Block robot (locked):** primary kit id for the skinned asset keeps label **Block robot**; existing mesh recipe is relabeled **Block robot (parts)** (separate `KitId`, e.g. `block-robot-parts`) so US-34 can still skin the create-group fixture.

## Spawn path

1. `createFromKit(skinnedId)` → fetch/parse GLB (reuse `parseGltfFile` / content-router skinned validation)
2. `importModelResults` / `addImportedModelToLibrary` — **do not** use `addCreatedModelToLibrary`
3. `source: 'imported'` so US-31 helper + bone outliner apply automatically
4. Embedded animations → `importClipsFromAnimations` as owned (no auto-select — T-pose until user picks)

## Asset authoring (locked)

**Approach:** offline script from the create-group Block robot recipe → bones + **rigid** weights (each segment 100% to one bone); commit `public/kits/block-robot.glb` (or equivalent). Script is maintainers-only — not run in the browser and not shipped as a user feature.

**Clips:** bind / T-pose only — **no** embedded demo animations. Users import / retarget clips as today.

Soft weights / Blender hand-authoring remain optional later polish; not required for US-33 MVP.

### Bone / clip contract

Canonical note (names, hierarchy, poly budget, license, no clips / no root motion): [`public/kits/README.md`](../../public/kits/README.md). Keep that file in sync when the GLB or recipe joint list changes.

## Export / round-trip

Same as any imported model. No create-part stamps required. Group export (US-26/32) works if the user groups this model with others.

## Failure modes

- Missing / corrupt kit URL → From kit modal or toast error; no library mutation
- GLB has no skinned mesh → treat as kit misconfiguration error (do not fall back silently to mesh recipe)

## Fold into current on ship

- Update US-27 kit wording: starters may be mesh recipes **or** skinned assets
- Soften / remove “Bones, skinning… on created models” only for the **kit asset** path (created empty models still unskinned until US-34)
- CHANGELOG row **US-33**; delete this folder
