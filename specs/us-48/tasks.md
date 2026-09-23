# US-48 — Tasks

Tick only after acceptance. **Kicked off** — implement only tasks that are decided / carved.

Depends on shipped US-40 / US-46. Independent of US-47; do not start US-47 in this US.

## Spec / kickoff

- [x] **Confirm kickoff** — Explicit start from product owner / session
- [x] **Changelog Open row** — Add US-48 to `specs/CHANGELOG.md` Open
- [x] **Decide undo on remove-active** — **One command**: remove list entry + clear live map when it was active (single undo restores both)
- [x] **Decide file apply** — **Always append**: new file apply adds a list entry and sets it active; previous entries stay (no replace-in-place)
- [x] **Decide none UI** — **Explicit “No skin” row** under the model (not deselect-only); selecting it clears the live map and leaves `activeSkinId` null
- [x] **Decide import seed** — **Seed** from existing imported `.map` as the first list entry (active); empty list only when no map on load
- [x] **Carve scope in current** — Library texture rows for created parts; skinned session list + pick/none; keep US-47 atlas editor separate
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Created parts — Library

- [x] **Part texture rows** — Nested row under textured created parts; label; clear (+ optional replace)
- [x] **Revision sync** — Rows after prep Apply / undo / redo
- [x] **Unit / UI check** — No row when no map

## Skinned — session list

- [ ] **Store** — Per `modelId` `skins[]` + `activeSkinId`; dispose on model remove/replace
- [ ] **Add on apply** — US-40 / toolbar / file path appends entry and sets active
- [ ] **Pick / none** — Commit via `commitMaterialColorMapChange`; export only active
- [ ] **Remove entry** — Dispose; clear live map if it was active
- [ ] **Library rows** — One row per list entry; selected = active
- [ ] **Seed** — Existing imported `.map` becomes the first entry (active) on add / replace / load
- [ ] **Unit tests** — Append keeps previous; pick none clears material; remove active; dispose on unload; failed decode adds nothing

## Verify

- [ ] **Created** — Apply in prep modal → Library row → clear from Library → undo restores map
- [ ] **Skinned add two** — Apply A, apply B → both rows, B live → pick A → A live → none → no map
- [ ] **Remove** — Remove inactive keeps live; remove active clears
- [ ] **US-40 file apply still works** — Feeds the list
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
