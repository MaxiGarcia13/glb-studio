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

- `url` or bundler URL to a `.glb` (prefer static asset under `public/kits/` or `src/assets/kits/`)
- Optional `defaultFileName` for the library row (e.g. `Block robot.glb`)
- Documented bone contract (humanoid names aligned with bone registry where practical)

`listStarterKits` / From kit modal: unchanged UX; skinned kits appear beside mesh kits.

## Spawn path

1. `createFromKit(skinnedId)` → fetch/parse GLB (reuse `parseGltfFile` / content-router skinned validation)
2. `importModelResults` / `addImportedModelToLibrary` — **do not** use `addCreatedModelToLibrary`
3. `source: 'imported'` so US-31 helper + bone outliner apply automatically
4. Embedded animations → `importClipsFromAnimations` as owned (no auto-select — T-pose until user picks)

## Asset authoring

| Option                                                      | Pros                       | Cons                                                        |
| ----------------------------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| Hand-authored GLB in Blender                                | Full control, real weights | Content work; keep in sync with brand look                  |
| Offline script: create-group recipe → bones + rigid weights | Matches current robot look | Script maintenance; weights are rigid (no bend deformation) |

**MVP recommendation:** hand-authored or script-generated GLB checked into the repo; not generated at runtime in the browser.

Rigid skinning (each segment weighted 100% to one bone) is acceptable for MVP if the look matches the current Block robot; soft weights are nicer but not required for US-33.

## Export / round-trip

Same as any imported model. No create-part stamps required. Group export (US-26/32) works if the user groups this model with others.

## Failure modes

- Missing / corrupt kit URL → From kit modal or toast error; no library mutation
- GLB has no skinned mesh → treat as kit misconfiguration error (do not fall back silently to mesh recipe)

## Fold into current on ship

- Update US-27 kit wording: starters may be mesh recipes **or** skinned assets
- Soften / remove “Bones, skinning… on created models” only for the **kit asset** path (created empty models still unskinned until US-34)
- CHANGELOG row **US-33**; delete this folder
