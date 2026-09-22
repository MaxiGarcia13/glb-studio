# US-40 — Albedo maps on skinned (imported) models

Delta: replace / clear color maps on skinned library models. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-28 (shipped — decode / apply / clear / export helpers).

**Status:** Planned — not kicked off.

**Note:** Albedo (`.map`) only. No prep modal (crop / wrap / bg-remove — stays US-39 on created parts). Full PBR stays out.

## Story

As an editor user, when I focus a skinned model (imported character, skinned kit, or created-then-skinned), I can apply or clear an image color map on its mesh material so UV atlas skins (e.g. Kenney) and custom albedos show in the viewport and export.

## Acceptance

- [ ] When focused model is a skinned library model (`isSkinnedLibraryModel`), user can **apply** an image (png/jpeg/webp, US-28 caps) as `MeshStandardMaterial.map` on a target skinned mesh
- [ ] User can **clear** the map and return to flat / previous non-map appearance (material `color` stays multiplier)
- [ ] Target resolution: selected `SkinnedMesh` when selected; else sole skinned mesh under the focused model; multi-mesh with no clear target → disabled + clear reason
- [ ] Entry UI available for skinned focus (not the create-only toolbar); created-part Texture / US-39 prep unchanged
- [ ] Post–Skin model models are included (same gate — no special case)
- [ ] Oversized / failed decode shows a clear error; material not left in a broken black state
- [ ] Exported GLB includes the applied map
- [ ] Created (non-skinned) models stay on US-28 / US-39 path only

## Out of scope

- Texture prep modal on imported / skinned materials (crop, wrap presets, client bg-remove)
- Full PBR maps (normal, roughness, metalness)
- UV unwrap / texture painting
- Auto skin picker for a specific content pack (Kenney as kit content can be a later content US)
- Editing materials on non-skinned imported mesh-only scenes beyond existing created path
