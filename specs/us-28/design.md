# US-28 — Part color maps (design)

## Approach

1. Inspector control: file input → `create/adapters/load-image-texture` (`createImageBitmap` + `Texture`, sRGB). No leftover blob URLs. Supported: PNG / JPEG / WebP. Client caps: 16 MB file, 8192 px longest edge. Decode / type / size failures throw `ImageTextureError` with copy the inspector can show; do not dispose the previous map until decode succeeds.
2. Assign via `applyPartColorMap` / `clearPartColorMap` (`create/domain/part-color-map`): set / unset `MeshStandardMaterial.map`, `needsUpdate = true`, leave `color` as multiplier. `disposeImageTexture` on clear / replace (replace goes through `loadImageTexture(..., previous)`). Inspector: `PartTextureControl` (Choose / Replace + Clear) under PartInspector — gated by created-part selection.
3. Export: `GLTFExporter` embeds maps when present on materials — verify with a manual pack
4. Gate UI on `source === 'created'` and mesh selection

## Clothes / outfits

Real cloth is out of scope. Outfit looks continue to come from **extra kit meshes** (US-27) plus optional textures on those parts here.

## Non-goals

No change to the global “no material editing” rule for imported assets; document the created-only exception in `current/` when this US ships.
