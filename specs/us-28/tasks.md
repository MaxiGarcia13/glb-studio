# US-28 — Tasks

Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Explicitly carve the created-only exception to the material/texture out-of-scope rule when shipping
- [ ] **Fold prep note** — On ship: update `current/` out-of-scope wording, changelog, delete this folder

## Texture apply

- [x] **Load image to texture helper** — Client-side only; dispose previous texture on replace; handle decode failures with user-visible error
- [ ] **Inspector Texture control** — File picker + Clear; only for selected part on focused created model
- [ ] **Material update** — Set / unset `map` on `MeshStandardMaterial` without breaking flat-color workflow

## Lifecycle / export

- [ ] **Dispose on part delete / model remove** — No leaked blob URLs or GPU textures
- [ ] **Export embeds maps** — Zip / GLB from created textured part shows the image in an external viewer
- [ ] **Imported guard** — No texture controls when focusing an imported model

## Verify

- [ ] **Box + png** — Apply, clear, re-apply, export
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
