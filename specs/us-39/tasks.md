# US-39 — Tasks

Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Explicit start (US-28 apply / clear / export is shipped)
- [ ] **Fold prep note** — On ship: fold into `current/`, changelog row, delete this folder

## Modal shell

- [x] **Texture prep modal** — Open from create toolbar Texture; Cancel / Apply; created-part gate
- [x] **Live 3D preview** — Draft map on preview of selected part kind / mesh; `ViewportEnvironment`
- [x] **Choose / replace image** — US-28 decode path; errors and guidance visible in modal

## Prep controls

- [x] **Crop + flip** — Client-side; updates draft + preview
- [x] **Wrap presets** — Clamp / Tile 2× / Tile 4× (or equivalent) on draft texture
- [x] **Remove background** — Opt-in client WASM; busy state; alpha draft
- [x] **Material alpha** — Transparent cutouts preview + export when map has alpha

## Lifecycle

- [x] **Apply commits; Cancel disposes** — Real part unchanged on cancel; no leaked bitmaps/textures
- [ ] **Imported guard** — Modal never opens for imported focus

## Verify

- [ ] **Box + png** — Guidance, crop, wrap, optional bg-remove, Apply, export, Cancel discard
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
