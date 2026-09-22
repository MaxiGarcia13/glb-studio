# US-28 — Tasks

Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Explicitly carve the created-only exception to the material/texture out-of-scope rule when shipping
- [ ] **Fold prep note** — On ship: update `current/` out-of-scope wording, changelog, delete this folder

## Texture apply

- [x] **Load image to texture helper** — Client-side only; dispose previous texture on replace; handle decode failures with user-visible error
- [x] **Create toolbar Texture control** — File picker + Clear; only for selected part on focused created model
- [x] **Material update** — Set / unset `map` on `MeshStandardMaterial` without breaking flat-color workflow

## Lifecycle / export

- [x] **Dispose on part delete / model remove** — No leaked blob URLs or GPU textures
- [x] **Export embeds maps** — Zip / GLB from created textured part shows the image in an external viewer
- [x] **Imported guard** — No texture controls when focusing an imported model

## Verify

- [ ] **Box + png** — Apply, clear, re-apply, export
- [x] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
