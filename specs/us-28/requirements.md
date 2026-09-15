# US-28 — Part color maps (textures)

Delta for optional image textures on created-model parts. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (part inspector on created models). Improves with US-24 (more parts to texture).

**Status:** Not started — do not implement until explicitly kicked off.

**Note:** Product-wide “material / texture editing” on imported characters remains out of scope; this US is **created parts only**.

## Story

As an editor user, I can apply a simple image texture to a selected part on my created model so props and kit pieces look less flat, and the texture is included when I export a GLB.

## Acceptance

- [ ] Part inspector on a **created** model offers **Texture**: choose an image file (png/jpeg/webp as supported by the browser stack)
- [ ] Applying a texture sets `MeshStandardMaterial.map` (and marks material for update); part keeps its color as multiplier unless design defines “replace color”
- [ ] User can **clear** the texture and return to flat color
- [ ] Primitives keep default UVs; no UV editor in this US
- [ ] Exported GLB includes the texture image for textured parts
- [ ] Imported character materials are not editable through this UI
- [ ] Oversized / failed decodes show a clear error; do not corrupt the part material into a black void without recovery

## Out of scope

- Full PBR authoring (normal, roughness maps, metalness maps) — color map only unless trivial extras are free
- Texture painting / projection painting
- Cloth simulation or garment authoring
- UV unwrap tools
- Material editing on imported GLBs
- Server-side texture processing
