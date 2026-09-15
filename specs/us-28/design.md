# US-28 — Part color maps (design)

## Approach

1. Inspector control: file input → `TextureLoader` or `createImageBitmap` + `CanvasTexture` / `Texture`
2. Assign to selected mesh material `map`; `needsUpdate = true`; store a revoke/dispose strategy for previous blob textures on replace/clear/remove part
3. Export: `GLTFExporter` embeds maps when present on materials — verify with a manual pack
4. Gate UI on `source === 'created'` and mesh selection

## Clothes / outfits

Real cloth is out of scope. Outfit looks continue to come from **extra kit meshes** (US-27) plus optional textures on those parts here.

## Non-goals

No change to the global “no material editing” rule for imported assets; document the created-only exception in `current/` when this US ships.
