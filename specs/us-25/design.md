# US-25 — Grid and rotation snap (design)

## Approach

1. Store snap flags + steps on `$viewportSettings` — session-only like axes (same `map`, not a separate `$createSettings`)
2. **Live path:** `TransformControls` built-in `translationSnap` / `rotationSnap` when focused model `source === 'created'` (Move = world space, Edit = local). Rotation snap is degrees→radians. Scale never. Avoid post-`objectChange` re-quantize — it fights the gizmo and makes large steps feel dead
3. Scale snap is **out of MVP** for this US
4. UI: `SnapControls` in top **Settings** menu under Axes — checkboxes + step inputs (labelled; step fields disabled when their snap flag is off). Note that coarse steps (e.g. `10` m) only jump after dragging about half a step

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
- Move tool on created model root also snaps (same `objectChange` + `applySnapToObject`)
- Imported models: gizmo never quantizes, even if snap flags are on
- Settings XYZ readout typing does not auto-snap (gizmo-only for this US)

## Non-goals

No separate “construction grid” mesh unless needed for clarity; existing ground grid + axes are enough.
