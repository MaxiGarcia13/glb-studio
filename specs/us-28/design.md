# US-28 — Part color maps (design)

## Approach

1. Create toolbar control (next to color): file input → `create/adapters/load-image-texture` (`createImageBitmap` + `Texture`, sRGB). No leftover blob URLs. Supported: PNG / JPEG / WebP. Client caps: 16 MB file, 8192 px longest edge. Decode / type / size failures throw `ImageTextureError` with copy shown in the tool `title`; do not dispose the previous map until decode succeeds.
2. Assign via `applyPartColorMap` / `clearPartColorMap` (`create/domain/part-color-map`): set / unset `MeshStandardMaterial.map`, `needsUpdate = true`, leave `color` as multiplier. `disposeImageTexture` (`src/utils/dispose-image-texture`) on clear / replace / part delete / model remove (`deletePart`, `disposeScene`). UI: `PartTextureTool` on the create floating toolbar (click = choose/replace, right-click = clear; filled when a map is set) — gated by created-part selection same as color.
3. Export: `packModelGlb` → `GLTFExporter` embeds `map` as `images` / `textures` / `baseColorTexture` when present — covered by `created-color-map-export` unit test (no extra exporter flags).
4. Gate UI on `source === 'created'` and mesh selection (`PartTextureTool` on create toolbar).

## Clothes / outfits

Real cloth is out of scope. Outfit looks continue to come from **extra kit meshes** (US-27) plus optional textures on those parts here.

## Non-goals

No change to the global “no material editing” rule for imported assets; document the created-only exception in `current/` when this US ships.

Crop / wrap presets / client background-remove / prep modal with live preview → **US-39** (do not implement under US-28).
