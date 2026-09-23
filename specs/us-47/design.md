# US-47 — Skinned atlas skin editor (design)

## Approach

1. **Skin profile (model-owned contract)**
   - Resolve from kit/asset metadata and/or mesh `userData` / registry:  
     `{ skinTemplateId?: string; atlasSize: { w: number; h: number }; mode: 'templated' | 'freeform' }`.
   - Template registry (studio ids only): size defaults, named slots with normalized rects (`u0,v0,u1,v1`), optional base fill colors.
   - Optional **content packs** register stamps + preset full atlases under a `skinTemplateId` — never required for the editor to open in freeform.
   - No vendor string in ids (`humanoid-atlas-v1`, not `kenney-…`).

2. **Draft canvas**
   - Offscreen canvas (or equivalent) at profile / current-map resolution.
   - Seed from existing `.map` when present; else template base or neutral skin-tone fills for known slots.
   - Composite: background → slot fills → stamps → optional brush layer.
   - Bake to `CanvasTexture` / ImageBitmap with `flipY: false` for skinned apply.

3. **Live preview**
   - Modal viewport (reuse `ViewportEnvironment` spirit like US-39): clone or draft-only material on the target `SkinnedMesh`.
   - Update texture on pointer-up / debounced color drag; dispose draft on Cancel.
   - Preview is **the focused model’s mesh**, not a generic mannequin.

4. **Apply / Cancel**
   - Apply → `commitMaterialColorMapChange` (US-46) with the baked texture; one undo entry.
   - Cancel → discard draft; restore preview material if mutated.
   - Keep US-40 file choose/replace as alternate entry (no prep modal).

5. **UI**
   - Modal: atlas canvas | 3D preview; tool strip by mode (slot chips, color, stamp grid, clear).
   - Show resolution; soft guides for templated slots.
   - Entry from `SkinnedTextureToolbar` and/or Library texture row (“Edit skin…”).

6. **Adaptation rules**
   - Canvas size follows profile or current map; stamps scale via normalized slots.
   - Multi-mesh: one target at a time via existing `resolveSkinnedTextureTarget` (+ explicit picker if needed).
   - Post–Skin created models: default **freeform** or **disabled** — never show character-kit stamps unless a template is explicitly attached later.
   - Focus/model change: close modal or hard-reset draft (prefer close + toast).

7. **Module placement**
   - Prefer `create/` next to skinned albedo helpers (domain: template registry, composite; components: modal; actions: open/apply).
   - Keep Three material mutation behind existing commit helpers; no R3F in pure domain composite math.

## Non-goals

- Vendor-locked packs as the only way to use the editor.
- Full painting suite / layers / blend modes.
- Automatic UV unwrap for created block characters.
- PBR channel editing.

## Open kickoff decisions

- Entry control placement (toolbar vs Library vs both).
- Post–Skin created: freeform vs disabled.
- UV-island overlay in freeform: in MVP or defer.
- Brush + download PNG: in MVP or follow-up.
