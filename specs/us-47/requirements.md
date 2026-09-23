# US-47 — Skinned atlas skin editor (build + live preview)

Delta: beginner-friendly **atlas skin editor** for skinned library models — draw / stamp / recolor a color map with a live 3D preview, adapting canvas size and layout to the focused model. Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** **US-40** / **US-46** (skinned albedo apply / clear / session undo + Library texture rows) — already shipped in `current/`.

**Status:** Planned — not kicked off. Do not implement until explicit start.

## Story

As an editor user focusing a skinned character (kit or import), I can open a **Skin editor** that shows a flat atlas canvas beside a live preview of **my** model, so I can build looks (skin tone, hair, clothes, etc.) without knowing UVs — and Apply puts the baked map on the mesh for viewport + export.

## Acceptance

### Entry + gating

- [ ] When focus is `isSkinnedLibraryModel` and a skinned texture target resolves (same rules as US-40), user can open **Skin editor** (toolbar and/or Library texture row affordance — pick at kickoff)
- [ ] Editor is **disabled** with a clear reason when: no skinned target; multiple skinned meshes with no selected target; model has no usable skin profile for templated tools (see modes); session busy / decode limits
- [ ] **Created-then-skinned** models that only have primitive part UVs (US-34 rigid bind) do **not** get fake face/shirt slots; they either stay on US-28/US-39 per-part texturing for remaining created workflow, or open **freeform** only if a single atlas target exists — document choice at kickoff (recommend: freeform or disabled + reason, never templated stamps)
- [ ] Cancel / close discards the draft and frees GPU / canvas resources; library model map unchanged until Apply
- [ ] Apply commits via the existing skinned albedo path (`flipY: false`, session undo like US-46)

### Adapts to the model

- [ ] Canvas **width × height** come from the model’s skin profile (or current `.map` image size when editing an existing map); UI shows the resolution
- [ ] Switching focused model (or target mesh) while the modal is open does not silently reuse another model’s draft size/layout — close or reset with clear behavior (document at kickoff)
- [ ] Multi-mesh: editor targets the resolved mesh; if several textured meshes, user can switch target (tabs or picker) without inventing a single shared UV when meshes differ
- [ ] Stamp / slot coordinates are **normalized** to the active template so the same stamp pack works at different atlas sizes (e.g. 512 vs 1024)

### Modes (vendor-agnostic)

- [ ] **Templated** — when the model (or kit asset contract) declares a studio-owned `skinTemplateId` with slot rects: show faint region guides + labels; support **fill/recolor** per slot and **stamp** placement into slots
- [ ] **Freeform** — when no template (or user chooses Advanced): blank or current-map canvas + simple brush / eraser; optional UV-island overlay sampled from the mesh (stretch if hard — may defer overlay to a follow-up task)
- [ ] No vendor names (e.g. Kenney) in chrome, domain ids, or required asset paths; content packs are optional registries keyed by `skinTemplateId`, not by vendor

### Authoring MVP

- [ ] Live **3D preview** of the focused model’s target mesh using the draft atlas (lights/ground consistent with other prep previews)
- [ ] At least: **slot fill (color)**, **stamp pick + place** (templated), **clear slot / reset draft**, **Apply**, **Cancel**
- [ ] Optional in this US if time: simple brush inside active slot; download baked PNG — otherwise explicit out-of-scope below
- [ ] Oversized / failed decode or bake shows an in-modal error; does not leave the live material black/broken

### Guidance

- [ ] Short copy that this is a **color map for this character’s UVs**; arbitrary photos may look wrong without a matching template
- [ ] Templated UI reads as “dress the character” (skin / hair / clothes), not “edit UV islands”

## Out of scope

- Full PBR maps (normal / roughness / metalness authoring)
- UV unwrap / retopology / weight paint
- Coupling domain or UI to a single content vendor or hardcoding their file paths
- Kit marketplace / remote stamp download
- Texture prep crop/wrap/bg-remove on skinned (US-39 stays created-parts)
- Auto-generating templates by guessing UV islands from arbitrary imports (may warn + freeform only)
- Durable undo across reloads; collaborative editing
- Replacing US-40 file-picker apply — keep apply-from-file as a fast path alongside Skin editor

## Product intent

1. User focuses a skinned character that declares a skin template (or uses freeform).
2. Opens Skin editor → canvas sized to that model + live preview.
3. Picks skin tone / stamps clothes / optional paint → sees the character update.
4. Apply → map on mesh → export GLB includes the baked atlas.
5. Another kit with a different size or layout uses a different template id — same editor, different profile.

## Cross-links

- Skinned albedo apply → US-40 / US-46 in [`specs/current/`](../current/)
- Created part texture prep → US-39 (not this modal)
- Skinned kits pattern → US-33
- In-editor Skin model → US-34 (primitive UVs; see gating above)
