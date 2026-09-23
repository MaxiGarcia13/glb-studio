# US-40 — Skinned albedo maps (design)

## Approach

1. **Gate:** `isSkinnedLibraryModel(activeModel)` — covers File → Import skinned, US-33 kits, and US-34 Skin model (`source → imported`).
2. **Target material:** `resolveSkinnedTextureTarget` / `getSkinnedTextureAvailability` — selected `SkinnedMesh` in active scene; else sole skinned mesh; else disabled + reason (multi-mesh with no skinned selection; non-standard material).
3. **Apply / clear:** Shared material helpers — `applyColorMap` / `replaceColorMap` / `clearColorMap` (`material-color-map`) + `loadImageTexture` / `replaceMaterialColorMapFromFile`. Create prep commits via `replaceColorMap`; skinned file pick uses `replaceMaterialColorMapFromFile` (`flipY: false` for glTF UV atlases). Dispose previous map on replace/clear; alpha sync via `syncMaterialMapAlpha`.
4. **UI:** `SkinnedTextureToolbar` (bottom-center floating chip when `isSkinnedLibraryModel`) — `SkinnedTextureTool` click choose/replace via file input; right-click clear. Disable + `title` from `getSkinnedTextureAvailability.reason`. Decode errors as `role="alert"` near the chip. Do **not** open US-39 prep modal.
5. **Guidance:** Short title/tooltip — prefer UV atlas skins; arbitrary photos often look wrong on character UVs.
6. **Created parts:** US-28 / US-39 gates unchanged (`createPart` + `source === 'created'`).

## Non-goals

- No change to US-39 imported guard (prep stays created-only).
- No Kenney-specific registry in this US unless we later add a content kit.
- Session undo for maps + Library texture rows → [`specs/us-46/`](../us-46/) (planned; not this US).
