# US-43 — Round corners (design)

## Approach

1. **Kind registry**
   - Extend box `sizeFields` with `{ param: 'cornerRadius', label: 'Corner radius', min: 0, … }`.
   - Extend `PartSizeParams` / param key union.
   - `createGeometry({ width, height, depth, cornerRadius })`:
     - `cornerRadius <= 0` → existing `BoxGeometry` path (bit-compatible enough for tests).
     - else → `RoundedBoxGeometry` (from `three/addons` or `@react-three/drei` factory usable from domain without R3F) with segment count chosen for quality vs perf (document default e.g. 4).
   - Keep **ground origin**: bottom of bounding box on y = 0 after build (reuse `withGroundOrigin`).

2. **Clamp policy**
   - `maxRadius = 0.5 * min(width, height, depth) - epsilon` (or RoundedBoxGeometry’s own limit).
   - `setPartSizeParam` already clamps to field.max — set `max` dynamically **or** clamp inside `createGeometry` and write back clamped param (prefer single clamp in `setPartSizeParam` via kind hook if needed).

3. **Inspector**
   - Automatic via `sizeFields` map — no special UI beyond label/unit.

4. **Crafted parts**
   - If `crafted`, size fields including corner radius remain hidden (US-41). Copy in Reset tooltip: rounding is parametric on the primitive.

5. **Optional second kind at kickoff**
   - Cylinder: top/bottom edge bevel is a separate geometry path — only if MVP time allows; otherwise box-only acceptance.

## Non-goals

- No CSG.
- No per-edge bevel selection.
- No migration of existing library scenes beyond default `cornerRadius: 0` when reading old userData (missing key → 0).
