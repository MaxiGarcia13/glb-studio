# US-39 — Texture prep modal (crop, wrap, bg remove)

Delta for a prep modal on created-part color maps (builds on US-28). Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-28 (apply / clear / export color maps on created parts).

**Status:** Not started — do not implement until explicitly kicked off.

**Note:** Created parts only. Imported character materials stay out of scope. No server-side image pipeline in this US.

## Story

As an editor user, when I texture a created part I can open a prep modal, see a live 3D preview of how the image will look, crop and wrap it, optionally remove the background in the browser, and get clear guidance so I upload a good image — then Apply commits the map or Cancel discards the draft.

## Acceptance

- [ ] Create toolbar **Texture** on a selected created part opens a **Texture** prep modal (not a silent file-only apply once this US ships); right-click / Clear still removes the map without opening the modal when appropriate
- [ ] Modal shows a **live 3D preview** of the selected part with the draft texture (reuse `ViewportEnvironment` lights + ground; same spirit as browse-part-kinds preview)
- [ ] User can **choose / replace** the source image (png/jpeg/webp per US-28 caps); decode / size failures show **in the modal** (not only a toolbar tooltip)
- [ ] Modal shows short **upload guidance** (prefer square or part-friendly aspect; PNG for transparency; aim ≤ 2048px on the long edge under hard caps; flat logos / patterns work better than busy photos)
- [ ] Soft **warnings** for non-square-ish or very large (but still under hard max) images; hard rejects keep US-28 limits
- [ ] User can **crop** and **flip** the draft image before Apply
- [ ] User can pick **wrap presets** that drive Three texture wrap/repeat (at least: Clamp / stretch default, Tile 2×, Tile 4×) — no UV unwrap editor
- [ ] Optional **Remove background** runs **client-side** (e.g. `@imgly/background-removal` or equivalent WASM); opt-in button with busy state; copy notes it runs in the browser; not auto-run on every pick
- [ ] Transparent maps preview and export correctly enough for cutouts (`transparent` / `alphaTest` or equivalent on the part material when alpha is present)
- [ ] **Apply** commits the draft to the real part material (US-28 apply path); **Cancel** / close discards the draft and frees GPU / ImageBitmap resources — library part unchanged on cancel
- [ ] Imported / non-created focus never opens this modal
- [ ] No Sharp / server texture endpoint in this US

## Out of scope

- Server-side Sharp / resize / normalize API
- Full UV unwrap or projection painting
- Full PBR map authoring (normal, roughness, metalness)
- Auto bg-remove on every upload
- Texture prep on imported GLB materials
- Texture painting
