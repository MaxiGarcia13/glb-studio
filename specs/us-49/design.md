# US-49 — Export as folders + flat wardrobe embed (design)

## Approach

1. **Modal** — checkbox `Export as folders` on the Export modal; pass `layout: 'flat' | 'folders'` on `ExportZipOptions` (default `flat`).
2. **Flat pack (default)** — `packModelGlb` attaches temporary invisible helper meshes (one `MeshBasicMaterial.map` per `$sessionSkinsByModel` entry) + root `userData.threeEditorSessionSkins` `{ version, activeSkinId, skins[] }`, exports, then detaches. Live material keeps the active map. On import, `seedSessionSkinsFromModel` → `restoreSessionSkinsFromScene` rebuilds the wardrobe and strips helpers; else US-48 single-map seed.
3. **Folder pack** — when `folders`, for each single export unit:
   - `packModelGlb(model, clips, { includeClips: false, embedSessionSkins: false })` → `{Base}/{Base}.{ext}`
   - For each owned-ready + validating-shared clip → `packClipGlb` → `{Base}/animations/{Clip}.{ext}`
   - For each wardrobe entry → PNG → `{Base}/skins/{label}.png`
4. **Paths** — sanitize each path segment; join with `/` for JSZip.
5. **finalizeEntries** — convert only model/clip GLB entries when Format is FBX; leave `.png` unchanged.
6. **Groups** — unchanged pack; optional `{GroupBase}/{GroupBase}.{ext}` wrap.
7. **Shared root sidecars** — omit when already under a model folder; shared-only export stays flat.

## Module placement

- `export/domain/attach-session-skins-for-export.ts`, `create/domain/session-skins-manifest.ts`, `create/domain/restore-session-skins-from-scene.ts`
- `export/domain/zip-download/` folder orchestration + PNG adapter
- Modal UI in `export-modal` / `export-file-names`

## Kickoff decisions

| Topic            | Decision                                        |
| ---------------- | ----------------------------------------------- |
| Opt-in folders   | Checkbox; default flat                          |
| Flat skins       | All wardrobe textures embedded in the model GLB |
| Folder model GLB | Mesh + active map; clips + skins as sidecars    |
| Skin PNG files   | Folder layout only                              |
| Round-trip       | GLB extras contract; FBX not required           |
| Groups           | One file; optional folder wrap only             |
