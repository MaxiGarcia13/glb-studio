# US-25 — Grid and rotation snap

Delta for easier alignment while building created models. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-23 (created models + Edit transforms). Benefits from US-14 (axes / metres) already shipped.

**Status:** In progress (kicked off).

## Story

As an editor user, I can snap part moves and rotations to the grid so wheels, walls, and limbs line up without careful freehand nudging.

## Acceptance

- [ ] Settings (General or Create) exposes **Snap to grid** (position) with a step in metres (default sensible, e.g. `0.1`)
- [ ] Settings exposes **Snap rotation** with a step in degrees (default e.g. `15` or `45`)
- [ ] While snap is on and the user transforms a part (or model root in Move) on a **created** model, gizmo commits quantize to the step
- [ ] Snap can be toggled off for free placement; session-only (no persistence required)
- [ ] Imported character editing is unchanged when snap is off; if snap applies globally, document that in design — prefer **created-model focus only** for MVP of this US
- [ ] World axes / rulers (US-14) remain the visual reference; snap step should feel related to metres

## Out of scope

- Vertex / edge snap between parts
- Magnet snap to other part pivots
- Click-to-place spawn on grid (nice follow-up; not required here)
- Physics or collision-based placement
