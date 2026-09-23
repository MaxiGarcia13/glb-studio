# US-47 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start.

Depends on shipped US-40 / US-46 (skinned albedo apply + undo). Prefer extending `create/` skinned texture helpers rather than a parallel material stack.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start from product owner / session
- [x] **Changelog Open row** — Add US-47 to `specs/CHANGELOG.md` Open
- [ ] **Decide entry UI** — Toolbar and/or Library texture row label for opening Skin editor
- [ ] **Decide post–Skin created gating** — Freeform atlas vs disabled + reason (no fake character slots)
- [ ] **Decide MVP extras** — Brush-in-slot and/or Download PNG in this US vs follow-up
- [ ] **Decide freeform UV overlay** — Sample UV islands in MVP vs defer
- [ ] **Carve scope in current** — Soften “no painting / prep on skinned” to allow this Skin editor; keep full PBR / unwrap out; point to this delta
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain — profile + templates

- [ ] **Skin profile resolver** — From focused skinned model / kit metadata / current map size → `{ mode, atlasSize, skinTemplateId? }`; unit tests for templated, freeform, missing target
- [ ] **Template registry** — Studio-owned template ids with atlas default size + normalized slot rects + labels; no vendor ids; unit tests for slot → pixel bounds at 512 and 1024
- [ ] **Content pack shape (optional data)** — Stamp + preset atlas registration keyed by `skinTemplateId` only; empty pack must not break editor; document how a pack is added without domain hardcoding paths
- [ ] **Availability helper** — `getSkinEditorAvailability(activeModel, selected)` mirroring US-40 target rules + mode gates; clear disabled reasons

## Domain — draft composite + bake

- [ ] **Draft canvas model** — Create/resize canvas from profile; seed from existing map or template base; dispose helpers
- [ ] **Slot fill** — Set solid color in a slot (templated); does not leak outside slot bounds
- [ ] **Stamp composite** — Draw stamp image into a slot (contain/cover policy documented); works at multiple atlas sizes via normalized rects
- [ ] **Clear slot / reset draft** — Restore slot or full draft to seed state
- [ ] **Bake to skinned texture** — Canvas → texture with `flipY: false`; size within US-28 decode caps; error path leaves previous map intact
- [ ] **Unit tests** — Fill, stamp bounds, bake flipY, dispose; fixture tiny template (not a vendor skin file)

## Actions / commit

- [ ] **Open Skin editor action** — Resolves target + profile; opens modal with draft; no library mutation yet
- [ ] **Apply draft** — `commitMaterialColorMapChange` (or equivalent US-46 path); one undo entry; Library rows / toolbar sync via `$materialMapsRevision`
- [ ] **Cancel draft** — Discard canvas/textures; no undo entry; model unchanged
- [ ] **Focus/model change while open** — Close or reset per kickoff decision; no cross-model draft leak

## UI — modal

- [ ] **Skin editor modal shell** — Atlas canvas pane + live 3D preview pane; resolution label; Apply / Cancel; a11y labels / focus trap consistent with other editor modals
- [ ] **Live preview viewport** — Focused model target mesh with draft map; lights/ground consistent with US-39 spirit; dispose on unmount
- [ ] **Templated tools** — Slot chips (skin / hair / face / clothes / … from template labels), color control, stamp picker when pack present
- [ ] **Freeform tools** — Brush and/or eraser per MVP decision; no fake slot chips when mode is freeform
- [ ] **Guides** — Faint slot outlines + labels in templated mode only
- [ ] **Errors** — In-modal message for decode/bake/size failures; no black void material without recovery
- [ ] **Entry controls** — Wire chosen entry points; disabled + reason when availability fails

## Content (optional, not blocking editor)

- [ ] **Document pack authoring** — How maintainers add a template + stamps without vendor coupling (README or kits contract)
- [ ] **Sample template (studio-owned)** — Minimal abstract template for tests / demos (solid slots); **not** required to ship a third-party character pack in this US

## Verify

- [ ] **Templated flow** — Open on a model with profile → change skin + clothing stamp → preview updates → Apply → viewport + export GLB show map; Undo restores previous map
- [ ] **Size adaptation** — Same stamps on 512 and 1024 (or two profile sizes) land in correct regions
- [ ] **Freeform flow** — Model without template opens freeform (or disabled per decision); Apply still works
- [ ] **Multi-mesh** — No target / wrong target disabled; selected mesh receives map
- [ ] **Post–Skin created** — Matches kickoff gating (no misleading character stamps)
- [ ] **Cancel** — No library mutation; no leaked GPU resources (spot-check dispose)
- [ ] **US-40 file apply still works** — Skin editor does not remove choose/replace file path
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
