# US-40 — Skinned albedo maps (design)

## Approach

1. **Gate:** `isSkinnedLibraryModel(activeModel)` — covers File → Import skinned, US-33 kits, and US-34 Skin model (`source → imported`).
2. **Target material:** Resolve selected object → `SkinnedMesh` in active scene; else if exactly one skinned mesh in scene, use that; else no target.
3. **Apply / clear:** Reuse `loadImageTexture`, `applyPartColorMap` / `clearPartColorMap` (or rename to material-level helpers shared by create + skinned). Dispose previous map on replace/clear.
4. **UI:** Compact Texture control for skinned focus (floating chip or Settings) — click choose/replace; right-click clear. Do **not** open US-39 prep modal.
5. **Guidance:** Short title/tooltip — prefer UV atlas skins; arbitrary photos often look wrong on character UVs.
6. **Created parts:** US-28 / US-39 gates unchanged (`createPart` + `source === 'created'`).

## Non-goals

- No change to US-39 imported guard (prep stays created-only).
- No Kenney-specific registry in this US unless we later add a content kit.
