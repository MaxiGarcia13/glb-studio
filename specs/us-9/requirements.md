# US-9 — Graph / curve keyframe UI

Delta for editing animation curves beyond pose-and-save. Parent contract: [`specs/current/requirements.md`](../current/requirements.md).

**Depends on:** US-4 (keyframe data on clips). Post-MVP.

## Story

As an editor user, I can inspect and edit keyframe curves (times and values) for tracks on the active clip.

## Acceptance

- [x] UI shows tracks for the active clip (filterable by selected bone/node)
- [x] User can select a keyframe and edit its time and values
- [x] User can add / delete keyframes on a track from the graph or key list
- [x] Edits update the working clip and are reflected on next mixer rebind / play
- [x] Interpolation mode is visible; changing it is supported where Three.js track types allow
- [x] Bottom preview bar switches **Timeline** (scrubber) vs **Tracks** (track list | key table); transport stays available in both modes
- [x] Keyframe UI lives only in Tracks mode — Settings Animation has no Keys panel

## Out of scope for this delta

- Full nonlinear editorial / blending UI (US-7)
- Retargeting, morph-only panels (US-8 may share selection patterns)
- Unlimited undo (US-10)
- After Effects–grade curve / Bezier graph (optional later inside Tracks)
