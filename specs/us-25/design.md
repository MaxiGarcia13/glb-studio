# US-25 — Grid and rotation snap (design)

## Approach

1. Store snap flags + steps on `$viewportSettings` (or a small `$createSettings` if create-specific) — session-only like axes
2. On TransformControls `objectChange` / Save commit path for created-model edits, round position (world or local — pick **world XZ + Y** for position snap) and Euler degrees for rotation
3. Scale snap is optional and **out of MVP** for this US unless trivial
4. UI: checkbox + numeric step next to General axes controls, or under a Create section

## Policy

- Apply when focused model `source === 'created'` so Mixamo character posing is not surprising
- Move tool on created model root also snaps

## Non-goals

No separate “construction grid” mesh unless needed for clarity; existing ground grid + axes are enough.
