# US-26 — Tasks

Tick only after acceptance.

## Spec / kickoff

- [x] **Confirm kickoff** — Do not implement until asked
- [ ] **Fold prep note** — On ship: fold into `current/`, changelog, delete this folder

## Hierarchy (parts domain)

- [x] **`parentPart(child, parent)` helper** — Reparent with world-transform preservation; allow parent = parts root
- [x] **Unparent control** — Move selected part back under the parts root without jumping in world space
- [x] **Parent picker UI** — Choose target parent from other parts _(superseded by Group menu — remove Settings Parent select)_

## Outliner

- [x] **Part list for focused created model** — Show mesh names; indent optional if hierarchy depth > 1
- [x] **Click to select** — Integrates with existing selection + TransformControls + inspector
- [x] **Keep list in sync** — Refresh on add / duplicate / delete / parent changes
- [x] **Collapse parent rows** — Chevron expands/collapses children in the part outliner

## Multi-select

- [ ] **Multi-selection store** — Active + additional targets (parts and/or model ids); plain click replaces; clear rules for not mixing parts with models
- [ ] **Shift+click in library** — Toggle model rows and part outliner rows in the multi-selection
- [ ] **Shift+click in viewport** — Toggle raycast-picked parts (and model roots if applicable) in the multi-selection
- [ ] **Selection highlight** — Multi-selected parts/models readable in library + viewport

## Context menu (Group / Ungroup)

- [ ] **Right-click menu shell** — ActionMenu-style panel at pointer (library + preview); dismiss on outside click / Escape
- [ ] **Group parts** — Parent non-active selected parts under active part (same created model); cycle guard; world preserve
- [ ] **Ungroup parts** — Unparent selection to parts root
- [ ] **Group models** — Put selected models in one session group (library tree + export unit)
- [ ] **Ungroup models** — Dissolve model group membership
- [ ] **Remove Settings Parent select** — Grouping only via context menu (drop inspector Parent `<select>`)
- [ ] **Retire or fold toolbar Unparent** — Prefer Ungroup in the context menu; remove duplicate control if redundant

## Export (group replaces merge)

- [ ] **Pack model groups as one GLB** — Each editor model group → one file (reuse merge pack / bone prefix / Scene bake as needed)
- [ ] **Ungrouped models stay separate** — US-5 per-model GLBs when not in a group
- [ ] **Remove Merge checkbox** — Drop Export modal Merge toggle and `mergeModels` opt-in; grouping is the opt-in
- [ ] **Export entry point unchanged** — Modal only from File → Export / export button

## Verify

- [ ] **Car body + wheels** — Group wheels under body; moving body moves wheels; export retains hierarchy
- [ ] **Cycle guard** — Cannot group a part under its own descendant
- [ ] **Shift+click + Group** — Library and viewport; parts-only and models-only selections
- [ ] **Grouped models export** — Two grouped models → one GLB; ungrouped → separate; no Merge checkbox
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md) checked
