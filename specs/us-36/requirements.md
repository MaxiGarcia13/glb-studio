# US-36 — Export format: GLB or FBX

Delta so **File → Export** can download the same zip layout as **FBX** files when the user chooses that format. Default stays **GLB** (today’s in-browser path). Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-5 (zip export), US-22 (Export modal), US-16 (convert API pattern on Vercel Node).

**Status:** Open — product choices locked; implement per tasks.

## Story

As an editor user, when I choose **File → Export** I can pick **GLB** (default) or **FBX** so the zip contains the same models / groups / shared animations as today, but with the chosen file extension — without changing how I pack or name entries.

## Acceptance

- [ ] Export modal exposes a **Format** control with **GLB** (default) and **FBX**
- [ ] Choosing **GLB** keeps today’s path: in-browser `GLTFExporter` → zip of `.glb` files — **no** convert hop
- [ ] Choosing **FBX** packs the same units as GLB first, then converts each packed file to FBX via `POST /api/v1/glb-to-fbx` before zipping; zip entries use `.fbx` basenames (same collision / sanitize rules as GLB, extension swapped)
- [ ] Format applies to the **whole zip** (models, merged groups, and shared animation-only files) — not a per-file mix
- [ ] Default zip basename reflects format (`glb-export` / `fbx-export`); user-edited zip / model / group basenames still work; extensions auto-applied for the selected format
- [ ] Modal summary wording matches the selected format (GLB / FBX)
- [ ] Convert / oversize / non-glb failures are user-visible in the Export modal (modal stays open; no partial zip download)
- [ ] Convert API is a Vercel Node serverless function (`@astrojs/vercel`, not Edge); per-file body cap matches Vercel’s payload limit (typically 4.5MB) — same class of limit as US-16
- [ ] GLB export and Import (including FBX → GLB) remain unchanged when Format is GLB
- [ ] Empty-pack / busy / disable rules from US-5 / US-22 still apply

## Out of scope

- Per-entry format mix inside one zip
- Client-side FBX writer (Three has no supported exporter we rely on)
- Reversing `fbx2gltf` (that tool is FBX → glTF only)
- Changing pack rules (ownership, merge, bake, empty created-model omit)
- Guaranteeing bit-identical round-trip (export FBX → re-import) or preserving editor group manifest on FBX
- Blob / chunked upload for files over the Vercel payload cap
- Server accounts / collab

## Locked product choices (kickoff)

1. **Whole-zip format** — one Format select on the Export modal; all packed entries use that format.
2. **GLB default** — opening the modal resets Format to GLB (same as today’s behavior).
3. **Pack-then-convert** — always build GLB bytes with existing packers; FBX path converts those bytes on the server, then zips.
4. **Converter** — **`libassimp@0.3.0`** (Assimp) via **WASM** backend (`createAssimp({ backend: 'wasm' })` → `convert(…, { to: 'fbx' })`). Vercel ships `dist/wasm/libassimp.wasm` through `includeFiles`; optional platform NAPI addons are `excludeFiles` (same NFT pattern as US-16). Not a Linux Assimp CLI and not `fbx2gltf` (one-way).
5. **Size** — reject any single convert payload over ~4.5MB with a clear modal error (no silent skip of some entries).
