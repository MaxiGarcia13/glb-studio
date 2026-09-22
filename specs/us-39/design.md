# US-39 — Texture prep modal (design)

## Approach

1. **Entry:** `PartTextureTool` opens `TexturePrepModal` when a created part is selected (US-28 clear via right-click / explicit Clear stays available). Empty map → modal with choose-image empty state; existing map → seed draft from current `material.map` when practical.
2. **Layout:** Title “Texture” + part kind; hero R3F preview (`ViewportEnvironment`); source strip (thumbnail, name, Replace image…); persistent guidance callout; controls (crop, flip, wrap presets, Remove background); footer Cancel · Apply.
3. **Draft vs commit:** All edits mutate a **draft** texture / preview mesh material. Apply calls existing `loadImageTexture` / `applyPartColorMap` (or equivalent commit helper) on the real part. Cancel / unmount disposes draft GPU textures + ImageBitmaps; does not touch the library mesh map.
4. **Wrap presets:** Map UI choices to `Texture.wrapS/T` + `repeat` (Clamp = clamp-to-edge + 1×1; Tile 2× / 4× = repeat). Default UVs on primitives stay; no unwrap tools.
5. **Crop / flip:** Client canvas / `createImageBitmap` region + transforms → new draft bitmap/texture; hot-update preview.
6. **Background remove:** Lazy-load client WASM lib (prefer `@imgly/background-removal` or documented equivalent). Button is opt-in; show busy + “Runs in your browser”. Output PNG with alpha → draft refresh. Enable material transparency / alpha test when the committed map has alpha so cutouts read in viewport and export.
7. **Guidance / validation:** Soft warn (aspect, >2k but under hard max). Hard fail reuse US-28 `ImageTextureError` limits; surface copy in the modal body.
8. **Gates:** Created focus + stamped part selection only (same hooks as US-28).

## Non-goals

- No `POST /api/v1/…` Sharp or other server image hop in this US (may be a later delta if normalize-at-scale is still needed).
- No change to imported-material editing policy.
