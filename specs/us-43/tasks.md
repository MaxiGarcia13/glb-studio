# US-43 — Tasks

Tick only after acceptance. **Not kicked off** — do not implement until explicit start. **Independent of US-41** for box-only parametric bevel.

## Spec / kickoff

- [ ] **Confirm kickoff** — Explicit start
- [x] **Changelog Open row** — Add US-43 to `specs/CHANGELOG.md` Open
- [ ] **Decide MVP kinds** — Box only vs box + cylinder
- [ ] **Carve scope in current** — Document corner radius on box in create part kinds
- [ ] **Fold on ship** — Fold into `current/`, changelog Shipped row, delete this folder

## Domain

- [ ] **Param + types** — `cornerRadius` on box; default 0 for legacy records
- [ ] **Rounded geometry** — Ground-origin RoundedBox; clamp; unit tests
- [ ] **Crafted interaction** — Hidden when crafted (if US-41 already shipped; else note follow-up)

## UI

- [ ] **PartInspector field** — Live via sizeFields
- [ ] **Browse preview** — Default box preview remains sharp (radius 0) unless preview uses defaults intentionally

## Verify

- [ ] **Radius 0 vs mid vs clamp** — Visual + tests
- [ ] **Export GLB** — Rounded box in external viewer
- [ ] **Acceptance checklist** — All boxes in [`requirements.md`](./requirements.md)
