# US-43 — Round corners (parametric bevel on primitives)

Delta: round / bevel corners on supported create-part kinds via **size params** (no bake required). Parent: [`specs/current/requirements.md`](../current/requirements.md).

**Series:** Figure craft (US-41 → US-45).

**Depends on:** US-24 (part kinds + PartInspector size fields). **Does not require US-41** while bevel stays parametric.

**Status:** Planned — not kicked off.

## Story

As an editor user building props or blocky figures, I can round the corners of a box (and other supported solids) so edges look softer — without switching to freeform sculpt or boolean tools.

## Acceptance

- [ ] `box` kind gains a **corner radius / bevel** size param (metres, min `0` = sharp; max clamped vs smallest half-extent so geometry stays valid)
- [ ] Changing the param **rebuilds** geometry via `createGeometry` (same path as width/height/depth); part stays parametric (not crafted)
- [ ] PartInspector shows the new field with unit and sensible default `0`
- [ ] Viewport updates live; Duplicate / undo-add / paste still work via existing kind+params clipboard (no geometry blob required for bevel-only parts)
- [ ] Export embeds the rounded mesh
- [ ] At least one additional kind **documented as follow-up or included**: e.g. cylinder end bevel / capsule already soft — product pick at kickoff (MVP may be **box only**)
- [ ] Invalid radius (too large for current size) clamps or rejects with no NaN / inverted mesh
- [ ] Unit tests: radius `0` matches prior box; mid radius produces more vertices; clamp at max

## Out of scope

- True edge fillet on arbitrary crafted meshes
- Bevel brush (use US-42 Smooth for soft freeform)
- CSG chamfer
- Rounding imported meshes

## Notes

- Prefer **RoundedBoxGeometry** (drei/Three) or equivalent grounded construction with ground-origin offset preserved (`withGroundOrigin`).
- If a part is already **crafted** (US-41), bevel param stays hidden — Reset to box first, or a later US may offer “rebuild parametric box from bounds.”

## Cross-links

- Foundation (crafted interaction) → [`specs/us-41/`](../us-41/)
- Brushes → [`specs/us-42/`](../us-42/)
- Holes → [`specs/us-44/`](../us-44/)
- Fuse → [`specs/us-45/`](../us-45/)
