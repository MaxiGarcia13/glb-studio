# US-25 — Grid and rotation snap (design)

## Approach

1. Store snap flags + steps on `$viewportSettings` — session-only like axes (same `map`, not a separate `$createSettings`)
2. On TransformControls `objectChange` / Save commit path for created-model edits, round position (world or local — pick **world XZ + Y** for position snap) and Euler degrees for rotation
3. Scale snap is optional and **out of MVP** for this US unless trivial
4. UI: `SnapControls` in top **Settings** menu under Axes — checkboxes + step inputs (labelled; step fields disabled when their snap flag is off)

## `$viewportSettings` snap fields

| Key | Type | Default | Notes |
| --- | --- | --- | --- |
| `snapToGrid` | `boolean` | `false` | Position snap off until user enables |
| `gridStepMetres` | `number` | `0.1` | Matches axes minor tick / ground feel; clamp `0.01`–`10` |
| `snapRotation` | `boolean` | `false` | Rotation snap off until user enables |
| `rotationStepDegrees` | `number` | `15` | Clamp `1`–`180` |

Setters: `setSnapToGrid`, `setGridStepMetres`, `setSnapRotation`, `setRotationStepDegrees`. No persistence.

## Policy

- Apply when focused model `source === 'created'` so Mixamo character posing is not surprising
- Move tool on created model root also snaps

## Non-goals

No separate “construction grid” mesh unless needed for clarity; existing ground grid + axes are enough.
