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

| Piece                                              | Where                                            | Reuse for US-9                                           |
| -------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Find/create by node + suffix (`splitTrackName`)    | `clip-validate` + `writeHoldTrackData`           | Track identity / filter by selected bone                 |
| In-place times/values rewrite on a **cloned** clip | `writeHoldWindow`                                | Same array pattern for upsert / delete                   |
| Single-key upsert when `start === end`             | `writeHoldWindow`                                | Seed for “set sample at time”                            |
| Store publish + mixer rebind                       | `saveKeyframe` → `$clips` → `useClipMixerAction` | Mirror for graph commits (no `resumeMixerBindings` race) |

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

## Prep — MVP layout (revised: bottom chrome)

**Choice:** key-list MVP lives in the **bottom center column** (under the viewport), not Settings. A mode switch chooses **Timeline** (existing scrubber) vs **Tracks** (bones | tracks + key table). Settings Animation keeps trim / speed / blend only — **remove** the Keys collapsible once Tracks mode ships.

Chrome: Library | Viewport + bottom bar | Settings (trim / speed / blend). `$selection` / bone list in Tracks mode drives track filter.

### Why bottom chrome

- Settings `18rem` is too narrow for bones + tracks + key table
- Selecting a bone used to hide Animation (`part` focus); Tracks mode keeps editing next to the viewport
- Transport (play / pause / …) stays available in both modes via reusable controls

### Wireframe — bottom bar

```
┌──────────────────────────────────────────────────────────┐
│  [▶❚❚ ■ ⟲]              [ Timeline ▾ | Tracks ]          │  ← shared transport + mode
├──────────────────────────────────────────────────────────┤
│  Timeline mode: TimelineScrubber (existing)              │
│  Tracks mode:                                            │
│    ┌─────────────┬─────────────────────────────────────┐ │
│    │ bones       │ tracks list                         │ │
│    │ (filter /   │ selected track → key table          │ │
│    │  select)    │ (+ add/delete when those tasks land)│ │
│    └─────────────┴─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- Module: `editor-shell` hosts the bar wrapper + mode store; `animation` owns track/key UI + reusable `PlaybackControls`
- Default mode: Timeline
- Tracks mode bone column may mirror / drive `$selection` (Edit tool) so viewport gizmo and track filter stay in sync
- Tokens: `bg-surface` / `bg-control` / `border-border` / `text-fg*`; even spacing `2/4/6/8`

### Layout → implement mapping

| Task                                      | Lives in                                                   |
| ----------------------------------------- | ---------------------------------------------------------- |
| Reusable transport controls               | `animation` PlaybackControls (compose in both modes)       |
| Bottom bar mode switch Timeline \| Tracks | `editor-shell` preview playback wrapper + UI store         |
| Tracks pane: bones \| tracks + key table  | Move/adapt existing Keys UI from Settings                  |
| Remove Settings Keys                      | `editor-settings-sidebar` — trim / speed / blend only      |
| Add / delete keyframes                    | Tracks pane actions → domain helpers                       |
| Rebind + interpolation                    | Mixer rebind after `$clips` publish; label/Select on track |

## Non-goals

No After Effects–grade graph editor in v1 of this story — prioritize correct track mutation and readable UX over fancy Bezier tooling beyond what tracks support. No new shell column; curve sparkline optional later inside Tracks mode, not required to close US-9 acceptance.
