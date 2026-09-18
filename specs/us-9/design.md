# US-9 design

## Scope

Graph or key-list editor for existing clip tracks; complements TransformControls pose capture (US-4).

## Approach

- Read track times/values from the active working clip
- Present a curve graph and/or spreadsheet-style key list
- Mutations go through the same insert/update/delete helpers used by US-4 (single write path)
- Selection sync: viewport bone selection filters visible tracks when possible
- Keep canvas playback on refs; graph UI promotes discrete edits to React state

## Prep — US-4 helper reuse (confirmed)

**Verdict:** keep a **single write path** under `animation/domain/keyframe-write.ts`, but US-9 cannot call `writeNodeKeyframe` for graph edits. That API is hold-plateau TRS capture (playhead → clip end). Curve UI needs finer key CRUD on one track.

### Reusable today

| Piece | Where | Reuse for US-9 |
| ----- | ----- | -------------- |
| Find/create by node + suffix (`splitTrackName`) | `clip-validate` + `writeHoldTrackData` | Track identity / filter by selected bone |
| In-place times/values rewrite on a **cloned** clip | `writeHoldWindow` | Same array pattern for upsert / delete |
| Single-key upsert when `start === end` | `writeHoldWindow` | Seed for “set sample at time” |
| Store publish + mixer rebind | `saveKeyframe` → `$clips` → `useClipMixerAction` | Mirror for graph commits (no `resumeMixerBindings` race) |

Public export today: **`writeNodeKeyframe` only**. Hold helpers are private.

### Gaps (add in `keyframe-write`, do not fork)

- Delete key at index / time
- Move key time (and keep values)
- Upsert / edit sample on one track without hold-to-end or full TRS
- Read helpers: list tracks + keys for the active clip (UI layer)
- Interpolation: show `KeyframeTrack` default interpolant; change only where Three allows (no Bezier beyond track type)
- Morph / other suffixes: `splitTrackName` knows `.morphTargetInfluences`; pose write does not — graph should list any track, mutate generically by `valueSize`

### Contract for implement tasks

1. Extend `keyframe-write.ts` with pure clip→clip helpers (upsert / update time&value / delete).
2. Pose capture keeps using `writeNodeKeyframe`; graph / key-list call the new helpers only.
3. Store action clones the working clip, applies one helper, publishes to `$clips`, lets mixer rebind.

## Non-goals

No After Effects–grade graph editor in v1 of this story — prioritize correct track mutation and readable UX over fancy Bezier tooling beyond what tracks support.
