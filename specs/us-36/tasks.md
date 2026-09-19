# US-36 — Tasks

Tick only after acceptance criteria for that item pass.

## Spec / kickoff

- [x] **Lock product choices** — Whole-zip Format; GLB default; pack-then-convert; Assimp-class CLI; 4.5MB reject — see [`requirements.md`](./requirements.md)
- [x] **Design note** — Convert API + modal + naming — see [`design.md`](./design.md)

## Convert API

- [x] **Choose / pin Linux convert binary** — Locked **`libassimp@0.3.0` WASM** (Assimp); `astro.config.mjs` `includeFiles` / `excludeFiles` + `ssr.external` — see [`design.md`](./design.md)
- [x] **Server adapter `convertGlbToFbx`** — In-memory `libassimp` WASM; reject non-`.glb` (400) and oversize (413); injectable `glbToFbxConverter` for tests
- [x] **`POST /api/v1/glb-to-fbx`** — `prerender = false`; multipart `file`; return FBX with `content-disposition` basename `.fbx`
- [x] **Unit tests** — Validation paths with mocked converter (mirror `convert-fbx` tests)

## Client export path

- [x] **`ensureFbxFile` service** — POST buffer/file to convert API; surface error message for modal
- [x] **Format-aware file names** — `resolveExportFileName(…, 'glb' | 'fbx')`; zip default `glb-export` / `fbx-export`
- [ ] **`downloadExportZip({ format })`** — GLB path unchanged; FBX path convert-each-then-zip; fail closed (no partial download)
- [ ] **`useExportZip` + types** — Pass `format` through options

## Export modal UI

- [ ] **Format `<Select>`** — GLB / FBX; reset to GLB on open; editor UI tokens
- [ ] **Summary + defaults** — Copy and zip basename follow format
- [ ] **Error / busy** — Convert failures stay in modal; busy covers convert + zip

## Verify

- [ ] **GLB export** — Same zip contents as before; no convert network calls
- [ ] **FBX export** — Zip of `.fbx` files; opens in a DCC or engine smoke check (mesh ± skeleton ± clip as available)
- [ ] **Oversize / convert fail** — Modal error; no zip download
- [ ] **Import path** — FBX → GLB import still works; unaffected by this story
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)

## Ship

- [ ] Fold into `specs/current/`; CHANGELOG **US-36**; delete `specs/us-36/`
